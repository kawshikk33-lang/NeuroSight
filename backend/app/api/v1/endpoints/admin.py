from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.engineered_feature import EngineeredFeature
from app.models.user import User
from app.services.data_storage_service import DataStorageService
from app.services.ml_service import run_forecasting_pipeline, run_rfmq_pipeline
from app.tasks.jobs import models_train_task

router = APIRouter(dependencies=[Depends(require_admin)])


class TrainingRequest(BaseModel):
    trigger: str
    dataset_id: str
    training_type: str
    columns: dict[str, str]
    algorithm: str | None = None
    feature_columns: list[str] | None = None


@router.get("/datasets")
async def list_datasets(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all uploaded datasets with pagination."""
    from app.models.data_file import DataFile

    total = (
        db.query(DataFile)
        .filter(DataFile.user_id == current_user.id)
        .count()
    )
    datasets = (
        db.query(DataFile)
        .filter(DataFile.user_id == current_user.id)
        .order_by(DataFile.uploaded_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size
    return {
        "datasets": [
            {
                "id": dataset.id,
                "display_name": dataset.display_name,
                "size_bytes": dataset.size_bytes,
                "metadata": dataset.metadata_json,
                "uploaded_at": dataset.uploaded_at.isoformat(),
            }
            for dataset in datasets
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/training/start")
async def start_training(
    payload: TrainingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start model training with specified parameters."""
    dataset = await DataStorageService.get_file_data(payload.dataset_id, db=db, user_id=current_user.id)
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
def list_features(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List engineered features for current user."""
    features = (
        db.query(EngineeredFeature)
        .filter(EngineeredFeature.user_id == current_user.id)
        .order_by(EngineeredFeature.created_at.desc())
        .all()
    )
    return [
        {
            "id": feature.id,
            "name": feature.name,
            "formula": feature.formula,
            "feature_type": feature.feature_type,
            "description": feature.description,
            "metadata": feature.metadata_json,
            "created_at": feature.created_at.isoformat(),
        }
        for feature in features
    ]


@router.post("/features")
def create_feature(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new engineered feature."""
    feature = EngineeredFeature(
        user_id=current_user.id,
        name=payload.get("name", ""),
        formula=payload.get("formula", ""),
        feature_type=payload.get("feature_type", "numeric"),
        description=payload.get("description"),
        metadata_json=payload.get("metadata", {}),
    )
    db.add(feature)
    db.commit()
    db.refresh(feature)
    return {
        "id": feature.id,
        "name": feature.name,
        "formula": feature.formula,
        "feature_type": feature.feature_type,
        "description": feature.description,
        "metadata": feature.metadata_json,
        "created_at": feature.created_at.isoformat(),
    }


@router.put("/features/{feature_id}")
def update_feature(
    feature_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an engineered feature."""
    feature = (
        db.query(EngineeredFeature)
        .filter(
            EngineeredFeature.id == feature_id,
            EngineeredFeature.user_id == current_user.id,
        )
        .first()
    )
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    if "name" in payload:
        feature.name = payload["name"]
    if "formula" in payload:
        feature.formula = payload["formula"]
    if "feature_type" in payload:
        feature.feature_type = payload["feature_type"]
    if "description" in payload:
        feature.description = payload["description"]
    if "metadata" in payload:
        feature.metadata_json = payload["metadata"]

    db.commit()
    db.refresh(feature)
    return {
        "id": feature.id,
        "name": feature.name,
        "formula": feature.formula,
        "feature_type": feature.feature_type,
        "description": feature.description,
        "metadata": feature.metadata_json,
        "created_at": feature.created_at.isoformat(),
    }


@router.delete("/features/{feature_id}")
def delete_feature(
    feature_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an engineered feature."""
    feature = (
        db.query(EngineeredFeature)
        .filter(
            EngineeredFeature.id == feature_id,
            EngineeredFeature.user_id == current_user.id,
        )
        .first()
    )
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    db.delete(feature)
    db.commit()
    return {"deleted": True, "id": feature_id}
