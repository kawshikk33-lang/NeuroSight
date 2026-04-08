import csv
from io import StringIO

import pandas as pd
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.data_storage_service import DataStorageService
from app.services.ml_service import parse_csv_bytes, train_rfqu_model
from app.tasks.jobs import rfqu_analyze_task

router = APIRouter()

SEGMENT_COLORS = {
    "Champions": "#10b981",
    "Loyal": "#06b6d4",
    "Potential": "#3b82f6",
    "At Risk": "#f59e0b",
    "Hibernating": "#ec4899",
    "Lost": "#ef4444",
}

_latest_customers: list[dict] = []
_latest_segments: list[dict] = []


class MappingPayload(BaseModel):
    dataset_id: str
    mappings: dict[str, str]


def _segment_from_scores(recency: int, frequency: int, monetary: int, quantity: int) -> str:
    total = recency + frequency + monetary + quantity
    if total >= 16:
        return "Champions"
    if total >= 13:
        return "Loyal"
    if total >= 10:
        return "Potential"
    if total >= 7:
        return "At Risk"
    if total >= 5:
        return "Hibernating"
    return "Lost"


def _to_score(series: pd.Series, reverse: bool = False) -> pd.Series:
    ranked = series.rank(method="first")
    buckets = pd.qcut(ranked, q=5, labels=[1, 2, 3, 4, 5], duplicates="drop").astype(int)
    return 6 - buckets if reverse else buckets


def _analyze_from_dataframe(df: pd.DataFrame, mappings: dict[str, str]) -> tuple[list[dict], list[dict]]:
    required = ["customer_id", "recency", "frequency", "monetary", "quantity"]
    missing_map = [key for key in required if not mappings.get(key)]
    if missing_map:
        raise ValueError(f"Missing mapping keys: {', '.join(missing_map)}")

    mapped_columns = {key: mappings[key] for key in required}
    missing_columns = [col for col in mapped_columns.values() if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Mapped columns not found in dataset: {', '.join(missing_columns)}")

    working = df[list(mapped_columns.values())].rename(
        columns={
            mapped_columns["customer_id"]: "customer_id",
            mapped_columns["recency"]: "recency",
            mapped_columns["frequency"]: "frequency",
            mapped_columns["monetary"]: "monetary",
            mapped_columns["quantity"]: "quantity",
        }
    )

    working["recency"] = pd.to_numeric(working["recency"], errors="coerce")
    working["frequency"] = pd.to_numeric(working["frequency"], errors="coerce")
    working["monetary"] = pd.to_numeric(working["monetary"], errors="coerce")
    working["quantity"] = pd.to_numeric(working["quantity"], errors="coerce")
    working = working.dropna(subset=["customer_id", "recency", "frequency", "monetary", "quantity"])
    if working.empty:
        raise ValueError("No valid rows remain after applying mappings and numeric conversion")

    recency_score = _to_score(working["recency"], reverse=True)
    frequency_score = _to_score(working["frequency"])
    monetary_score = _to_score(working["monetary"])
    quantity_score = _to_score(working["quantity"])

    working["segment"] = [
        _segment_from_scores(r, f, m, q)
        for r, f, m, q in zip(recency_score, frequency_score, monetary_score, quantity_score)
    ]

    total = len(working)
    grouped = (
        working.groupby("segment")
        .size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
    )
    segments = [
        {
            "segment": row["segment"],
            "count": int(row["count"]),
            "percentage": round((int(row["count"]) / total) * 100, 2),
            "color": SEGMENT_COLORS.get(row["segment"], "#64748b"),
        }
        for _, row in grouped.iterrows()
    ]

    customers = [
        {
            "id": idx + 1,
            "name": str(row["customer_id"]),
            "recency": int(float(row["recency"])),
            "frequency": int(float(row["frequency"])),
            "monetary": float(row["monetary"]),
            "quantity": int(float(row["quantity"])),
            "segment": row["segment"],
        }
        for idx, (_, row) in enumerate(working.iterrows())
    ]
    return segments, customers


def _build_csv(rows: list[dict]) -> str:
    if not rows:
        return ""
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    try:
        content = await file.read()
        file_info = DataStorageService.save_uploaded_file(file.filename, content)
        return {
            "status": "uploaded",
            "file": file_info,
            "columns": file_info.get("column_names", []),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(exc)}") from exc


@router.post("/mappings/validate")
def validate_mappings(payload: MappingPayload):
    dataset = DataStorageService.get_file_data(payload.dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    required = {"customer_id", "recency", "frequency", "monetary", "quantity"}
    provided = set(payload.mappings.keys())
    missing = sorted(required - provided)
    unknown = sorted(provided - required)
    missing_columns = sorted(
        column for column in payload.mappings.values() if column not in dataset.columns
    )

    return {
        "valid": not missing and not unknown and not missing_columns,
        "missing": missing,
        "unknown": unknown,
        "missing_columns": missing_columns,
    }


@router.post("/analyze")
def analyze(payload: MappingPayload, background_tasks: BackgroundTasks):
    global _latest_customers, _latest_segments

    dataset = DataStorageService.get_file_data(payload.dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        segments, customers = _analyze_from_dataframe(dataset, payload.mappings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    _latest_segments = segments
    _latest_customers = customers

    job_id = f"rfqu-job-{len(customers)}"
    try:
        background_tasks.add_task(rfqu_analyze_task, job_id)
    except Exception as exc:
        return {"error": str(exc)}

    return {
        "job_id": job_id,
        "status": "started",
        "segments": segments,
        "customers": customers,
        "message": "RFMQ analysis completed",
    }


@router.get("/segments")
def segments():
    return _latest_segments


@router.get("/customers")
def customers(segment: str | None = Query(default=None)):
    if segment:
        return [c for c in _latest_customers if c["segment"] == segment]
    return _latest_customers


@router.get("/export")
def export_all():
    csv_content = _build_csv(_latest_customers)
    return Response(content=csv_content, media_type="text/csv")


@router.get("/export/{segment}")
def export_segment(segment: str):
    rows = [c for c in _latest_customers if c["segment"].lower() == segment.lower()]
    csv_content = _build_csv(rows)
    return Response(content=csv_content, media_type="text/csv")


@router.post("/train")
async def train(file: UploadFile = File(...)):
    data = await file.read()
    result = train_rfqu_model(parse_csv_bytes(data))
    return {"model_id": result.model_id, "metrics": result.metrics}


@router.get("/models")
def rfqu_models():
    return [{"model_id": "rfqu-kmeans-v1", "status": "active"}]
