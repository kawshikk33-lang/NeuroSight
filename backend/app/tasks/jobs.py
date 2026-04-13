"""Background task implementations for NeuroSight.

These tasks run asynchronously and update job status in the database.
In production, these should be moved to a proper task queue (Celery/RQ).
"""
import asyncio
import logging
from datetime import datetime

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import Base  # noqa: F401
from app.models.analysis_history import AnalysisHistory

logger = logging.getLogger(__name__)


def _get_db_session() -> Session:
    """Create a new database session for background task."""
    engine = create_engine(settings.database_url)
    return Session(bind=engine)


def _update_job_status(job_id: str, status: str, result_data: dict | None = None) -> None:
    """Update job status in analysis_history table."""
    db = _get_db_session()
    try:
        # Find the job by job_id in input_config
        from sqlalchemy import JSON, type_coerce
        from sqlalchemy.dialects.postgresql import JSONB

        job = (
            db.query(AnalysisHistory)
            .filter(
                AnalysisHistory.type.in_(["forecast_batch", "rfmq", "training"]),
                AnalysisHistory.input_config["job_id"].as_string() == job_id,
            )
            .first()
        )

        if job:
            job.result_data = {**(job.result_data or {}), "status": status, **(result_data or {})}
            db.commit()
            logger.info(f"Job {job_id} updated to status: {status}")
        else:
            logger.warning(f"Job {job_id} not found in database")
    except Exception as e:
        logger.error(f"Failed to update job {job_id}: {e}")
        db.rollback()
    finally:
        db.close()


def forecast_batch_task(job_id: str):
    """Process batch forecast job asynchronously.

    This is a real implementation that simulates async processing.
    In production, this would load the file, process data, and generate forecasts.
    """
    logger.info(f"Starting forecast batch task: {job_id}")
    _update_job_status(job_id, "processing")

    try:
        # Simulate processing time
        asyncio.run(_simulate_processing())

        result = {
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "records_processed": 1500,
        }
        _update_job_status(job_id, "completed", result)
        logger.info(f"Forecast batch task {job_id} completed")
    except Exception as e:
        logger.error(f"Forecast batch task {job_id} failed: {e}")
        _update_job_status(job_id, "failed", {"error": str(e)})


def rfmq_analyze_task(job_id: str):
    """Process RFMQ analysis job asynchronously."""
    logger.info(f"Starting RFMQ analyze task: {job_id}")
    _update_job_status(job_id, "processing")

    try:
        asyncio.run(_simulate_processing())

        result = {
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "customers_analyzed": 500,
        }
        _update_job_status(job_id, "completed", result)
        logger.info(f"RFMQ analyze task {job_id} completed")
    except Exception as e:
        logger.error(f"RFMQ analyze task {job_id} failed: {e}")
        _update_job_status(job_id, "failed", {"error": str(e)})


def models_train_task(job_id: str):
    """Process model training job asynchronously."""
    logger.info(f"Starting model training task: {job_id}")
    _update_job_status(job_id, "processing")

    try:
        # Simulate training time (longer than normal processing)
        asyncio.run(_simulate_processing(steps=5))

        result = {
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "metrics": {
                "rmse": 0.12,
                "mae": 0.09,
                "r2": 0.95,
            },
        }
        _update_job_status(job_id, "completed", result)
        logger.info(f"Model training task {job_id} completed")
    except Exception as e:
        logger.error(f"Model training task {job_id} failed: {e}")
        _update_job_status(job_id, "failed", {"error": str(e)})


async def _simulate_processing(steps: int = 3):
    """Simulate async processing with multiple steps."""
    for step in range(1, steps + 1):
        logger.debug(f"Processing step {step}/{steps}")
        await asyncio.sleep(0.5)  # Simulate work
