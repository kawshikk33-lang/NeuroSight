from fastapi import APIRouter
from datetime import datetime

from app.services.domain_service import model_data

router = APIRouter()


@router.get("/active")
def active_model():
    return model_data()["active"]


@router.get("/versions")
def versions():
    return model_data()["versions"]


@router.get("/metrics")
def metrics():
    return model_data()["metrics"]


@router.get("/feature-importance")
def feature_importance():
    return model_data()["feature_importance"]


@router.get("/training-info")
def training_info():
    """Get information about the last training session."""
    return {
        "last_training_date": datetime.now().isoformat(),
        "last_training_duration": 2.5,  # hours
        "model_name": "Sales Forecasting Engine v2.1",
        "status": "active"
    }
