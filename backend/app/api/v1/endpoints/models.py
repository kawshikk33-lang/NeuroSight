from fastapi import APIRouter
from datetime import datetime

from app.services.ml_service import get_latest_mlflow_run
from app.services.domain_service import model_data

router = APIRouter()

@router.get("/active")
def active_model():
    run = get_latest_mlflow_run()
    if run:
        return {
            "id": run["run_name"],
            "task": run["tags"].get("task", "Machine Learning Model")
        }
    return model_data()["active"]

@router.get("/versions")
def versions():
    # In a full implementation, we'd query all runs
    run = get_latest_mlflow_run()
    if run:
        return [{"id": run["run_name"], "status": "active"}]
    return model_data()["versions"]

@router.get("/metrics")
def metrics():
    run = get_latest_mlflow_run()
    if run and run.get("metrics"):
        return run["metrics"]
    return model_data()["metrics"]

@router.get("/hyperparameters")
def hyperparameters():
    run = get_latest_mlflow_run()
    if run and run.get("params"):
        return run["params"]
    return {}

@router.get("/training-info")
def training_info():
    run = get_latest_mlflow_run()
    if run:
        # get_latest_mlflow_run returns start_time timestamp in ms from epoch
        dt = datetime.fromtimestamp(run["start_time"] / 1000.0) if run["start_time"] else datetime.now()
        params = run.get("params", {})
        metrics = run.get("metrics", {})
        
        return {
            "last_training_date": dt.isoformat(),
            "last_training_duration": metrics.get("training_time", 0.0),
            "dataset_size": params.get("dataset_size", 0),
            "num_features": params.get("num_features", 0),
            "model_name": run["run_name"],
            "status": "active"
        }
    
    return {
        "last_training_date": datetime.now().isoformat(),
        "last_training_duration": 0.0,
        "dataset_size": 0,
        "num_features": 0,
        "model_name": "No active model",
        "status": "inactive"
    }

@router.get("/feature-importance")
def feature_importance():
    return model_data()["feature_importance"]
