import csv
import logging
from datetime import datetime, timedelta
from io import StringIO

import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.analysis_history import AnalysisHistory
from app.models.data_connector import DataConnector
from app.models.user import User
from app.services.audit_logger import AuditLogger
from app.services.data_storage_service import DataStorageService
from app.services.ml_service import parse_csv_bytes, train_rfmq_model
from app.tasks.jobs import rfmq_analyze_task

logger = logging.getLogger(__name__)

router = APIRouter()

SEGMENT_COLORS = {
    "Champions": "#10b981",
    "Loyal": "#06b6d4",
    "Potential": "#3b82f6",
    "At Risk": "#f59e0b",
    "Hibernating": "#ec4899",
    "Lost": "#ef4444",
}


class MappingPayload(BaseModel):
    dataset_id: str
    mappings: dict[str, str]


class AnalyzePayload(MappingPayload):
    range_type: str = "last_3_months"
    start_date: str | None = None
    end_date: str | None = None


class ConnectorAnalyzePayload(BaseModel):
    connector_id: str
    table_name: str
    mappings: dict[str, str]
    range_type: str = "last_3_months"
    start_date: str | None = None
    end_date: str | None = None


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
    unique_count = int(ranked.nunique())

    if unique_count <= 1:
        buckets = pd.Series([3] * len(ranked), index=ranked.index, dtype="int64")
    else:
        quantiles = min(5, unique_count, len(ranked))
        labels = list(range(1, quantiles + 1))
        buckets = pd.qcut(ranked, q=quantiles, labels=labels, duplicates="drop").astype(int)

        # Normalize reduced quantile sets to the same 1-5 scoring scale.
        if quantiles < 5:
            if quantiles == 2:
                buckets = buckets.map({1: 2, 2: 4}).astype(int)
            elif quantiles == 3:
                buckets = buckets.map({1: 1, 2: 3, 3: 5}).astype(int)
            elif quantiles == 4:
                buckets = buckets.map({1: 1, 2: 2, 3: 4, 4: 5}).astype(int)

    return 6 - buckets if reverse else buckets


def _filter_data_by_range(
    df: pd.DataFrame,
    date_col: str,
    range_type: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> tuple[pd.DataFrame, datetime | None]:
    valid_ranges = {"last_1_month", "last_3_months", "last_6_months", "last_1_year", "custom"}
    if range_type not in valid_ranges:
        raise ValueError("Invalid range_type")

    working = df.copy()
    working[date_col] = pd.to_datetime(working[date_col], errors="coerce")
    working = working.dropna(subset=[date_col])
    if working.empty:
        raise ValueError("Date column must contain valid datetime values")

    # Anchor relative ranges to the dataset timeline, not wall-clock time,
    # so historical datasets still produce valid filtered windows.
    anchor_date = working[date_col].max().to_pydatetime()

    reference_date: datetime | None = None

    if range_type == "last_1_month":
        cutoff = anchor_date - timedelta(days=30)
        working = working[working[date_col] >= cutoff]
    elif range_type == "last_3_months":
        cutoff = anchor_date - timedelta(days=90)
        working = working[working[date_col] >= cutoff]
    elif range_type == "last_6_months":
        cutoff = anchor_date - timedelta(days=180)
        working = working[working[date_col] >= cutoff]
    elif range_type == "last_1_year":
        cutoff = anchor_date - timedelta(days=365)
        working = working[working[date_col] >= cutoff]
    else:
        if not start_date or not end_date:
            raise ValueError("start_date and end_date are required for custom range")
        start = pd.to_datetime(start_date, errors="coerce")
        end = pd.to_datetime(end_date, errors="coerce")
        if pd.isna(start) or pd.isna(end):
            raise ValueError("Invalid start_date or end_date")
        if start > end:
            raise ValueError("start_date must be less than or equal to end_date")
        reference_date = end.to_pydatetime()
        working = working[(working[date_col] >= start) & (working[date_col] <= end)]

    if working.empty:
        raise ValueError("Dataset is empty after applying date filter")

    return working, reference_date


def _build_customer_aggregates(working: pd.DataFrame, reference_date: pd.Timestamp) -> pd.DataFrame:
    enriched = working.copy()
    enriched["line_amount"] = enriched["item_quantity"] * enriched["unit_price"]
    aggregated = (
        enriched.groupby("customer_id")
        .agg(
            last_purchase=("transaction_date", "max"),
            frequency=("transaction_date", "count"),
            monetary=("line_amount", "sum"),
            quantity=("item_quantity", "sum"),
        )
        .reset_index()
    )
    aggregated["recency"] = (reference_date - aggregated["last_purchase"]).dt.days
    aggregated = aggregated.dropna(subset=["recency", "frequency", "monetary", "quantity"])
    if aggregated.empty:
        raise ValueError("No customer-level records could be generated from mapped columns")

    recency_score = _to_score(aggregated["recency"], reverse=True)
    frequency_score = _to_score(aggregated["frequency"])
    monetary_score = _to_score(aggregated["monetary"])
    quantity_score = _to_score(aggregated["quantity"])

    aggregated["segment"] = [
        _segment_from_scores(r, f, m, q)
        for r, f, m, q in zip(recency_score, frequency_score, monetary_score, quantity_score)
    ]
    return aggregated


def _build_segments(aggregated: pd.DataFrame) -> list[dict]:
    total = len(aggregated)
    grouped = (
        aggregated.groupby("segment")
        .size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
    )
    return [
        {
            "segment": row["segment"],
            "count": int(row["count"]),
            "percentage": round((int(row["count"]) / total) * 100, 2),
            "color": SEGMENT_COLORS.get(row["segment"], "#64748b"),
        }
        for _, row in grouped.iterrows()
    ]


def _build_customers(aggregated: pd.DataFrame) -> list[dict]:
    return [
        {
            "id": idx + 1,
            "name": str(row["customer_id"]),
            "recency": int(float(row["recency"])),
            "frequency": int(float(row["frequency"])),
            "monetary": float(row["monetary"]),
            "quantity": int(float(row["quantity"])),
            "segment": row["segment"],
        }
        for idx, (_, row) in enumerate(aggregated.iterrows())
    ]


def _calculate_comparison(base_df: pd.DataFrame, range_type: str, current_aggregated: pd.DataFrame) -> dict | None:
    range_days = {
        "last_1_month": 30,
        "last_3_months": 90,
        "last_6_months": 180,
        "last_1_year": 365,
    }
    if range_type not in range_days:
        return None

    days = range_days[range_type]
    now = datetime.now()
    current_start = now - timedelta(days=days)
    previous_start = current_start - timedelta(days=days)
    previous_end = current_start

    previous_df = base_df[
        (base_df["transaction_date"] >= previous_start)
        & (base_df["transaction_date"] < previous_end)
    ]

    current_active = int(len(current_aggregated))
    current_lost_rate = float((current_aggregated["segment"] == "Lost").mean() * 100)

    if previous_df.empty:
        return {
            "available": False,
            "compare_label": "Previous period data unavailable",
            "active_customers_delta_pct": None,
            "churn_reduction_pct": None,
            "current_active_customers": current_active,
            "previous_active_customers": 0,
        }

    previous_reference = previous_df["transaction_date"].max()
    try:
        previous_aggregated = _build_customer_aggregates(previous_df, previous_reference)
    except ValueError:
        return {
            "available": False,
            "compare_label": "Previous period data unavailable",
            "active_customers_delta_pct": None,
            "churn_reduction_pct": None,
            "current_active_customers": current_active,
            "previous_active_customers": 0,
        }
    previous_active = int(len(previous_aggregated))
    previous_lost_rate = float((previous_aggregated["segment"] == "Lost").mean() * 100)

    active_delta_pct = None
    if previous_active > 0:
        active_delta_pct = round(((current_active - previous_active) / previous_active) * 100, 2)

    churn_reduction_pct = round(previous_lost_rate - current_lost_rate, 2)
    range_label_map = {
        "last_1_month": "Last 1 Month vs Previous 1 Month",
        "last_3_months": "Last 3 Months vs Previous 3 Months",
        "last_6_months": "Last 6 Months vs Previous 6 Months",
        "last_1_year": "Last 1 Year vs Previous 1 Year",
    }

    return {
        "available": True,
        "compare_label": range_label_map.get(range_type, "Current vs Previous Period"),
        "active_customers_delta_pct": active_delta_pct,
        "churn_reduction_pct": churn_reduction_pct,
        "current_active_customers": current_active,
        "previous_active_customers": previous_active,
    }


def _analyze_from_dataframe(
    df: pd.DataFrame,
    mappings: dict[str, str],
    *,
    range_type: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> tuple[list[dict], list[dict], dict]:
    required = ["customer_id", "transaction_date", "item_quantity", "unit_price"]
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
            mapped_columns["transaction_date"]: "transaction_date",
            mapped_columns["item_quantity"]: "item_quantity",
            mapped_columns["unit_price"]: "unit_price",
        }
    )

    working["transaction_date"] = pd.to_datetime(working["transaction_date"], errors="coerce")
    working["item_quantity"] = pd.to_numeric(working["item_quantity"], errors="coerce")
    working["unit_price"] = pd.to_numeric(working["unit_price"], errors="coerce")
    working = working.dropna(subset=["customer_id", "transaction_date", "item_quantity", "unit_price"])
    if working.empty:
        raise ValueError("No valid rows remain after applying mappings and numeric conversion")

    base_working = working.copy()
    working, custom_reference_date = _filter_data_by_range(
        working,
        "transaction_date",
        range_type,
        start_date,
        end_date,
    )

    reference_date = (
        pd.Timestamp(custom_reference_date)
        if custom_reference_date
        else working["transaction_date"].max()
    )
    aggregated = _build_customer_aggregates(working, reference_date)
    segments = _build_segments(aggregated)
    customers = _build_customers(aggregated)
    comparison = _calculate_comparison(base_working, range_type, aggregated)
    range_label_map = {
        "last_1_month": "Last 1 Month",
        "last_3_months": "Last 3 Months",
        "last_6_months": "Last 6 Months",
        "last_1_year": "Last 1 Year",
        "custom": f"Custom ({start_date} to {end_date})" if start_date and end_date else "Custom",
    }
    analysis_meta = {
        "analysis_period": range_label_map.get(range_type, "Custom"),
        "customers_analyzed": len(customers),
        "transactions_analyzed": int(len(working)),
        "range_type": range_type,
        "start_date": start_date,
        "end_date": end_date,
        "comparison": comparison,
    }
    return segments, customers, analysis_meta


def _build_csv(rows: list[dict]) -> str:
    if not rows:
        return ""
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    try:
        content = await file.read()
        file_info = await DataStorageService.save_uploaded_file(
            file.filename,
            content,
            db=db,
            user_id=current_user.id,
        )
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
async def validate_mappings(
    payload: MappingPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = await DataStorageService.get_file_data(payload.dataset_id, db=db, user_id=current_user.id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    required = {"customer_id", "transaction_date", "item_quantity", "unit_price"}
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
async def analyze(
    request: Request,
    payload: AnalyzePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    dataset = await DataStorageService.get_file_data(payload.dataset_id, db=db, user_id=current_user.id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        segments, customers, analysis_meta = _analyze_from_dataframe(
            dataset,
            payload.mappings,
            range_type=payload.range_type,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    history_entry = AnalysisHistory(
        user_id=current_user.id,
        file_id=payload.dataset_id,
        type="rfmq",
        input_config={
            "dataset_id": payload.dataset_id,
            "mappings": payload.mappings,
            "range_type": payload.range_type,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
        },
        result_data={
            "segments": segments,
            "customers": customers,
            **analysis_meta,
        },
    )
    db.add(history_entry)
    db.commit()

    AuditLogger.log(
        db=db,
        request=request,
        user=current_user,
        event_type="analysis_run",
        action="execute",
        description=f"RFMQ analysis on {payload.dataset_id}: {len(customers)} customers, {len(segments)} segments",
        resource_type="analysis",
        resource_name=f"RFMQ - {payload.dataset_id}",
        status_code=200,
        metadata={"dataset_id": payload.dataset_id, "range_type": payload.range_type, "customers": len(customers)},
    )

    job_id = f"rfmq-job-{len(customers)}"
    try:
        background_tasks.add_task(rfmq_analyze_task, job_id)
    except Exception as exc:
        return {"error": str(exc)}

    return {
        "job_id": job_id,
        "status": "started",
        "segments": segments,
        "customers": customers,
        **analysis_meta,
        "message": "RFMQ analysis completed",
    }


@router.get("/segments")
def segments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get latest RFMQ segments from database."""
    latest = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.user_id == current_user.id,
            AnalysisHistory.type == "rfmq",
        )
        .order_by(AnalysisHistory.created_at.desc())
        .first()
    )
    if not latest:
        return []
    return latest.result_data.get("segments", [])


@router.get("/customers")
def customers(
    segment: str | None = Query(default=None),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=500, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get latest RFMQ customers from database, optionally filtered by segment with pagination."""
    latest = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.user_id == current_user.id,
            AnalysisHistory.type == "rfmq",
        )
        .order_by(AnalysisHistory.created_at.desc())
        .first()
    )
    if not latest:
        return {"customers": [], "total": 0, "page": 1, "page_size": 50, "total_pages": 0}

    all_customers = latest.result_data.get("customers", [])
    if segment:
        all_customers = [c for c in all_customers if c["segment"] == segment]

    total = len(all_customers)
    total_pages = (total + page_size - 1) // page_size
    start = (page - 1) * page_size
    end = start + page_size
    paginated_customers = all_customers[start:end]

    return {
        "customers": paginated_customers,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/export")
def export_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all customers as CSV from database."""
    latest = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.user_id == current_user.id,
            AnalysisHistory.type == "rfmq",
        )
        .order_by(AnalysisHistory.created_at.desc())
        .first()
    )
    if not latest:
        return Response(content="", media_type="text/csv")
    return Response(content=_build_csv(latest.result_data.get("customers", [])), media_type="text/csv")


@router.get("/export/{segment}")
def export_segment(
    segment: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export specific segment customers as CSV from database."""
    latest = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.user_id == current_user.id,
            AnalysisHistory.type == "rfmq",
        )
        .order_by(AnalysisHistory.created_at.desc())
        .first()
    )
    if not latest:
        return Response(content="", media_type="text/csv")
    all_customers = latest.result_data.get("customers", [])
    rows = [c for c in all_customers if c["segment"].lower() == segment.lower()]
    return Response(content=_build_csv(rows), media_type="text/csv")


@router.post("/train")
async def train(file: UploadFile = File(...)):
    data = await file.read()
    result = train_rfmq_model(parse_csv_bytes(data))
    return {"model_id": result.model_id, "metrics": result.metrics}


@router.get("/models")
def rfmq_models():
    return [{"model_id": "rfmq-kmeans-v1", "status": "active"}]


# ---------------------------------------------------------------------------
# Connector-based RFMQ analysis endpoints
# ---------------------------------------------------------------------------

def _build_engine_url(config: dict) -> str:
    """Build a SQLAlchemy connection string from connector config."""
    db_type = config.get("db_type", "PostgreSQL")
    host = config.get("host", "")
    port = config.get("port", 5432 if db_type == "PostgreSQL" else 3306)
    database = config.get("database", "")
    username = config.get("username", "")
    password = config.get("password", "")
    if db_type == "PostgreSQL":
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"
    return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"


def _get_user_db_connector(connector_id: str, db: Session, user: User) -> DataConnector:
    """Fetch a database connector belonging to the current user."""
    connector = (
        db.query(DataConnector)
        .filter(
            DataConnector.id == connector_id,
            DataConnector.user_id == user.id,
            DataConnector.connector_type == "database",
        )
        .first()
    )
    if not connector:
        raise HTTPException(status_code=404, detail="Database connector not found")
    if connector.status != "connected":
        raise HTTPException(status_code=400, detail="Database connector is not in connected state")
    return connector


@router.get("/connector-tables/{connector_id}")
def list_connector_tables(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List tables from a connected database for RFMQ column selection."""
    connector = _get_user_db_connector(connector_id, db, current_user)
    try:
        engine = create_engine(
            _build_engine_url(connector.config),
            connect_args={"connect_timeout": 15},
        )
        db_type = connector.config.get("db_type", "PostgreSQL")
        with engine.connect() as conn:
            if db_type == "PostgreSQL":
                rows = conn.execute(
                    text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
                ).fetchall()
            else:
                rows = conn.execute(text("SHOW TABLES")).fetchall()
        engine.dispose()
        return {"tables": [r[0] for r in rows]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to list tables: {exc}") from exc


@router.get("/connector-columns/{connector_id}/{table_name}")
def list_connector_columns(
    connector_id: str,
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List column names for a specific table in a connected database."""
    connector = _get_user_db_connector(connector_id, db, current_user)
    try:
        engine = create_engine(
            _build_engine_url(connector.config),
            connect_args={"connect_timeout": 15},
        )
        db_type = connector.config.get("db_type", "PostgreSQL")
        with engine.connect() as conn:
            if db_type == "PostgreSQL":
                rows = conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = 'public' AND table_name = :tbl "
                        "ORDER BY ordinal_position"
                    ),
                    {"tbl": table_name},
                ).fetchall()
            else:
                rows = conn.execute(
                    text(f"SHOW COLUMNS FROM `{table_name}`")
                ).fetchall()
        engine.dispose()
        columns = [r[0] for r in rows]
        if not columns:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found or has no columns")
        return {"columns": columns}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to list columns: {exc}") from exc


@router.post("/analyze-from-connector")
async def analyze_from_connector(
    request: Request,
    payload: ConnectorAnalyzePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run RFMQ analysis directly from a connected database table."""
    connector = _get_user_db_connector(payload.connector_id, db, current_user)

    # Pull the full table into a DataFrame
    try:
        engine = create_engine(
            _build_engine_url(connector.config),
            connect_args={"connect_timeout": 30},
        )
        df = pd.read_sql_table(payload.table_name, engine)
        engine.dispose()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read table '{payload.table_name}': {exc}",
        ) from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="The selected table has no data")

    # Run the same analysis pipeline used for CSV uploads
    try:
        segments, customers, analysis_meta = _analyze_from_dataframe(
            df,
            payload.mappings,
            range_type=payload.range_type,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Persist to analysis history
    history_entry = AnalysisHistory(
        user_id=current_user.id,
        file_id=f"connector:{payload.connector_id}:{payload.table_name}",
        type="rfmq",
        input_config={
            "source": "database_connector",
            "connector_id": payload.connector_id,
            "table_name": payload.table_name,
            "mappings": payload.mappings,
            "range_type": payload.range_type,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
        },
        result_data={
            "segments": segments,
            "customers": customers,
            **analysis_meta,
        },
    )
    db.add(history_entry)
    db.commit()

    AuditLogger.log(
        db=db,
        request=request,
        user=current_user,
        event_type="analysis_run",
        action="execute",
        description=(
            f"RFMQ analysis from DB connector {connector.name} / {payload.table_name}: "
            f"{len(customers)} customers, {len(segments)} segments"
        ),
        resource_type="analysis",
        resource_name=f"RFMQ - connector:{payload.connector_id}",
        status_code=200,
        metadata={
            "connector_id": payload.connector_id,
            "table_name": payload.table_name,
            "range_type": payload.range_type,
            "customers": len(customers),
        },
    )

    job_id = f"rfmq-connector-{len(customers)}"
    try:
        background_tasks.add_task(rfmq_analyze_task, job_id)
    except Exception as exc:
        logger.warning("Background task failed: %s", exc)

    return {
        "job_id": job_id,
        "status": "started",
        "segments": segments,
        "customers": customers,
        **analysis_meta,
        "message": "RFMQ analysis from database completed",
    }
