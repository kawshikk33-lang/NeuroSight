from __future__ import annotations
import uuid
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.analysis_history import AnalysisHistory
from app.models.user import User
from app.services.ml_service import parse_csv_bytes, train_forecast_model
from app.tasks.jobs import forecast_batch_task, models_train_task

router = APIRouter()


def _period_label(forecast_type: str, start_date: date, index: int) -> str:
    if forecast_type == "quarterly":
        quarter_number = ((start_date.month - 1) // 3) + 1 + index
        year = start_date.year + (quarter_number - 1) // 4
        quarter = ((quarter_number - 1) % 4) + 1
        return f"Q{quarter} {year}"
    if forecast_type == "yearly":
        return str(start_date.year + index)
    month_offset = start_date.month - 1 + index
    year = start_date.year + month_offset // 12
    month = (month_offset % 12) + 1
    return date(year, month, 1).strftime("%b %Y")


def _build_forecast_series(forecast_type: str, horizon: int, model: str, show_confidence_interval: bool):
    base_values = {
        "monthly": 42000.0,
        "quarterly": 125000.0,
        "yearly": 520000.0,
    }
    model_multiplier = 1.08 if model == "xgboost" else 1.03
    base_growth = {"monthly": 0.06, "quarterly": 0.08, "yearly": 0.11}.get(forecast_type, 0.06)
    interval_ratio = 0.1 if show_confidence_interval else 0.0
    today = date.today().replace(day=1)

    series = []
    for index in range(horizon):
        trend_factor = 1 + (base_growth * index)
        seasonality = 1 + (((index % 3) - 1) * 0.015)
        forecast = base_values.get(forecast_type, 42000.0) * model_multiplier * trend_factor * seasonality
        lower = forecast * (1 - interval_ratio)
        upper = forecast * (1 + interval_ratio)
        point = {
            "period": _period_label(forecast_type, today, index),
            "forecast": round(forecast, 2),
        }
        if show_confidence_interval:
            point["lower"] = round(lower, 2)
            point["upper"] = round(upper, 2)
        series.append(point)

    return series


@router.post("/predict")
def predict(payload: dict):
    quantity = payload.get("quantity", 0)
    price = payload.get("price", 0)
    return {"prediction": float(quantity) * float(price) * 1.05}


@router.post("")
def forecast(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forecast_type = payload.get("forecast_type", "monthly")
    horizon = int(payload.get("horizon", 3))
    model = payload.get("model", "xgboost")
    show_confidence_interval = bool(payload.get("show_confidence_interval", False))

    if forecast_type not in {"monthly", "quarterly", "yearly"}:
        return {"error": "Invalid forecast_type"}
    if horizon < 1:
        return {"error": "Horizon must be at least 1"}
    if model not in {"xgboost", "random_forest"}:
        return {"error": "Invalid model"}

    series = _build_forecast_series(forecast_type, horizon, model, show_confidence_interval)
    expected_revenue = round(sum(point["forecast"] for point in series), 2)
    growth_rate = 0.0
    if len(series) > 1 and series[0]["forecast"]:
        growth_rate = round(((series[-1]["forecast"] - series[0]["forecast"]) / series[0]["forecast"]) * 100, 1)

    if growth_rate > 2:
        trend = "Increasing 📈"
    elif growth_rate < -2:
        trend = "Decreasing 📉"
    else:
        trend = "Stable →"

    response_payload = {
        "forecast_type": forecast_type,
        "horizon": horizon,
        "model": model,
        "expected_revenue": expected_revenue,
        "growth_rate": growth_rate,
        "trend": trend,
        "series": series,
    }
    history_entry = AnalysisHistory(
        user_id=current_user.id,
        file_id=None,
        type="forecast",
        input_config=payload,
        result_data=response_payload,
    )
    db.add(history_entry)
    db.commit()
    return response_payload


@router.post("/batch")
async def batch(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a batch forecast job and persist status in database."""
    job_id = f"forecast-job-{uuid.uuid4().hex[:8]}"

    # Persist job status to analysis_history table
    job_entry = AnalysisHistory(
        user_id=current_user.id,
        file_id=None,
        type="forecast_batch",
        input_config={"filename": file.filename, "job_id": job_id},
        result_data={"status": "queued", "filename": file.filename},
    )
    db.add(job_entry)
    db.commit()

    try:
        background_tasks.add_task(forecast_batch_task, job_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"job_id": job_id, "status": "started", "message": "Batch forecast running in background"}


@router.get("/jobs/{job_id}")
def job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get batch forecast job status from database."""
    job = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.user_id == current_user.id,
            AnalysisHistory.type == "forecast_batch",
            AnalysisHistory.input_config["job_id"].as_string() == job_id,
        )
        .first()
    )
    if not job:
        return {"job_id": job_id, "status": "unknown"}
    return {"job_id": job_id, **job.result_data}


@router.get("/history")
def forecast_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get forecast history from database."""
    entries = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.user_id == current_user.id,
            AnalysisHistory.type == "forecast",
        )
        .order_by(AnalysisHistory.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": entry.id,
            "created_at": entry.created_at.isoformat(),
            "input_config": entry.input_config,
            "result_data": entry.result_data,
        }
        for entry in entries
    ]


@router.post("/train")
async def train(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    data = await file.read()
    result = train_forecast_model(parse_csv_bytes(data))
    job_id = f"train-forecast-{result.model_id}"
    try:
        background_tasks.add_task(models_train_task, job_id)
    except Exception as exc:
        return {"error": str(exc)}
    return {
        "model_id": result.model_id,
        "metrics": result.metrics,
        "job_id": job_id,
        "status": "started",
        "message": "Training running in background",
    }


@router.get("/models")
def forecast_models():
    return [{"model_id": "forecast-rf-v1", "status": "active"}]
