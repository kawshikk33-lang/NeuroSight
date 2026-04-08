from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import require_admin
from app.services.data_storage_service import DataStorageService
from app.services.ml_service import run_forecasting_pipeline, run_rfmq_pipeline
from app.tasks.jobs import models_train_task

router = APIRouter(dependencies=[Depends(require_admin)])
_features: list[dict] = []


class TrainingRequest(BaseModel):
    trigger: str
    dataset_id: str
    training_type: str
    columns: dict[str, str]
    algorithm: str | None = None
    feature_columns: list[str] | None = None


@router.get("/datasets")
async def list_datasets():
    """List all uploaded datasets."""
    return await DataStorageService.get_file_list()


@router.post("/training/start")
async def start_training(payload: TrainingRequest, background_tasks: BackgroundTasks):
    """Start model training with specified parameters."""
    dataset = await DataStorageService.get_file_data(payload.dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if payload.training_type not in {"forecasting", "rfmq"}:
        raise HTTPException(status_code=400, detail="Invalid training_type")

    job_id = f"training-{hash(payload.dataset_id) % 10000}"

    try:
        if payload.training_type == "forecasting":
            target_column = payload.columns.get("target_column", "")
            date_column = payload.columns.get("date_column", "")
            if not target_column or not date_column:
                raise HTTPException(
                    status_code=400,
                    detail="Forecasting requires target_column and date_column",
                )

            train_result = run_forecasting_pipeline(
                dataset,
                target_column=target_column,
                date_column=date_column,
                feature_columns=payload.feature_columns,
                algorithm=payload.algorithm or "randomforest",
            )
        else:
            customer_id_column = payload.columns.get("customer_id_column", "")
            date_column = payload.columns.get("date_column", "")
            price_column = payload.columns.get("price_column", "")
            quantity_column = payload.columns.get("quantity_column", "")
            if not all([customer_id_column, date_column, price_column, quantity_column]):
                raise HTTPException(
                    status_code=400,
                    detail="RFMQ requires customer_id_column, date_column, price_column and quantity_column",
                )

            train_result = run_rfmq_pipeline(
                dataset,
                customer_id_column=customer_id_column,
                date_column=date_column,
                price_column=price_column,
                quantity_column=quantity_column,
            )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    training_config = {
        "job_id": job_id,
        "dataset_id": payload.dataset_id,
        "training_type": payload.training_type,
        "columns": payload.columns,
        "algorithm": payload.algorithm,
        "feature_columns": payload.feature_columns,
        "trigger": payload.trigger,
    }

    try:
        background_tasks.add_task(models_train_task, job_id)
    except Exception as exc:
        return {"error": str(exc)}

    return {
        "job_id": job_id,
        "status": "started",
        "model_name": train_result.model_id,
        "metrics": train_result.metrics,
        "config": training_config,
        "message": "Training running in background",
    }


@router.get("/training/{job_id}")
def training_status(job_id: str):
    """Get status of a training job."""
    return {
        "job_id": job_id,
        "status": "running",
        "progress": 45,
        "total": 100,
    }


@router.get("/features")
def list_features():
    """List engineered features."""
    return _features


@router.post("/features")
def create_feature(payload: dict):
    """Create a new engineered feature."""
    payload["id"] = len(_features) + 1
    _features.append(payload)
    return payload


@router.put("/features/{feature_id}")
def update_feature(feature_id: int, payload: dict):
    for idx, feature in enumerate(_features):
        if feature["id"] == feature_id:
            _features[idx] = {**feature, **payload, "id": feature_id}
            return _features[idx]
    return {"detail": "not found"}


@router.delete("/features/{feature_id}")
def delete_feature(feature_id: int):
    global _features
    _features = [f for f in _features if f["id"] != feature_id]
    return {"deleted": True}
