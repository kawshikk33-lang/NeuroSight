from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Iterable

import mlflow
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, silhouette_score, r2_score, mean_absolute_percentage_error
import time
from mlflow.tracking import MlflowClient
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from app.core.config import settings
from app.services.preprocessing_service import add_time_features, clean_dataframe

mlflow.set_tracking_uri(settings.mlflow_tracking_uri)


@dataclass
class TrainResult:
    model_id: str
    metrics: dict


def parse_csv_bytes(file_bytes: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(file_bytes))


def train_forecast_model(df: pd.DataFrame) -> TrainResult:
    cleaned = add_time_features(clean_dataframe(df))
    if "revenue" not in cleaned.columns:
        raise ValueError("Training data must include revenue column")
    cleaned = cleaned.dropna()
    y = cleaned["revenue"]
    X = cleaned.select_dtypes(include=["number"]).drop(columns=["revenue"], errors="ignore")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    start_time = time.time()
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_train_s, y_train)
    pred = model.predict(X_test_s)
    train_time = time.time() - start_time

    rmse = float(mean_squared_error(y_test, pred) ** 0.5)
    mae = float(mean_absolute_error(y_test, pred))
    mape = float(mean_absolute_percentage_error(y_test, pred)) * 100
    r2 = float(r2_score(y_test, pred))

    model_id = "forecast-rf-v1"
    with mlflow.start_run(run_name=model_id):
        mlflow.log_metric("rmse", rmse)
        mlflow.log_metric("mae", mae)
        mlflow.log_metric("mape", mape)
        mlflow.log_metric("r2", r2)
        mlflow.log_metric("training_time", train_time)
        mlflow.log_param("dataset_size", len(X))
        mlflow.log_param("num_features", X.shape[1])
        mlflow.log_params(model.get_params())
        mlflow.set_tag("task", "Time Series Forecasting")
        mlflow.sklearn.log_model(model, artifact_path="model")
    return TrainResult(model_id=model_id, metrics={"rmse": rmse, "mae": mae, "mape": mape, "r2": r2})


def train_rfmq_model(df: pd.DataFrame) -> TrainResult:
    cleaned = clean_dataframe(df).dropna()
    cols = [c for c in ["recency", "frequency", "monetary", "quantity"] if c in cleaned.columns]
    if len(cols) < 4:
        raise ValueError("RFMQ training data missing required columns")
    X = cleaned[cols]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    start_time = time.time()
    model = KMeans(n_clusters=4, random_state=42, n_init="auto")
    labels = model.fit_predict(X_scaled)
    train_time = time.time() - start_time

    sil = float(silhouette_score(X_scaled, labels))
    model_id = "rfmq-kmeans-v1"
    with mlflow.start_run(run_name=model_id):
        mlflow.log_metric("silhouette", sil)
        mlflow.log_metric("training_time", train_time)
        mlflow.log_param("dataset_size", len(X))
        mlflow.log_param("num_features", len(cols))
        mlflow.log_params(model.get_params())
        mlflow.set_tag("task", "Customer Segmentation")
        mlflow.sklearn.log_model(model, artifact_path="model")
    return TrainResult(model_id=model_id, metrics={"silhouette": sil})


def run_forecasting_pipeline(
    df: pd.DataFrame,
    *,
    target_column: str,
    date_column: str,
    feature_columns: Iterable[str] | None = None,
    algorithm: str = "randomforest",
) -> TrainResult:
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found")
    if date_column not in df.columns:
        raise ValueError(f"Date column '{date_column}' not found")

    working = df.copy()
    working[date_column] = pd.to_datetime(working[date_column], errors="coerce")
    if working[date_column].isna().all():
        raise ValueError("Date column must contain valid datetime values")

    numeric_target = pd.to_numeric(working[target_column], errors="coerce")
    if numeric_target.isna().all():
        raise ValueError("Target column must be numeric")
    working[target_column] = numeric_target

    selected_features = list(feature_columns or [])
    valid_features = [c for c in selected_features if c in working.columns]
    keep_cols = [target_column, date_column, *valid_features]
    working = working.loc[:, list(dict.fromkeys(keep_cols))]
    working = working.rename(columns={target_column: "revenue", date_column: "date"})

    result = train_forecast_model(working)
    result.model_id = f"forecast-{algorithm}-v1"
    return result


def run_rfmq_pipeline(
    df: pd.DataFrame,
    *,
    customer_id_column: str,
    date_column: str,
    price_column: str,
    quantity_column: str,
) -> TrainResult:
    required = [customer_id_column, date_column, price_column, quantity_column]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    working = df[[customer_id_column, date_column, price_column, quantity_column]].copy()
    working[date_column] = pd.to_datetime(working[date_column], errors="coerce")
    if working[date_column].isna().all():
        raise ValueError("Date column must contain valid datetime values")

    working[price_column] = pd.to_numeric(working[price_column], errors="coerce")
    working[quantity_column] = pd.to_numeric(working[quantity_column], errors="coerce")
    working = working.dropna(subset=[customer_id_column, date_column, price_column, quantity_column])
    if working.empty:
        raise ValueError("No valid rows available after parsing columns")

    working["_amount"] = working[price_column] * working[quantity_column]
    latest_date = working[date_column].max()

    grouped = (
        working.groupby(customer_id_column)
        .agg(
            last_purchase=(date_column, "max"),
            frequency=(date_column, "count"),
            monetary=("_amount", "sum"),
            quantity=(quantity_column, "sum"),
        )
        .reset_index(drop=True)
    )
    grouped["recency"] = (latest_date - grouped["last_purchase"]).dt.days
    rfmq_df = grouped[["recency", "frequency", "monetary", "quantity"]]

    return train_rfmq_model(rfmq_df)


def get_latest_mlflow_run(experiment_name: str = "0"):
    client = MlflowClient()
    try:
        # Get the latest run
        runs = client.search_runs(
            experiment_ids=["0"], 
            order_by=["start_time DESC"], 
            max_results=1
        )
        if not runs:
            return None
        latest_run = runs[0]
        return {
            "run_id": latest_run.info.run_id,
            "run_name": latest_run.info.run_name,
            "status": latest_run.info.status,
            "start_time": latest_run.info.start_time,
            "metrics": latest_run.data.metrics,
            "params": latest_run.data.params,
            "tags": latest_run.data.tags,
        }
    except Exception as e:
        print(f"Error fetching from MLflow: {e}")
        return None
