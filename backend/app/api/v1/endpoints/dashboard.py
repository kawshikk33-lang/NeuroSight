from fastapi import APIRouter

from app.services.domain_service import dashboard_data

router = APIRouter()


@router.get("/kpis")
def kpis():
    return dashboard_data()["kpis"]


@router.get("/forecast-trend")
def forecast_trend():
    return dashboard_data()["forecast_trend"]


@router.get("/segment-distribution")
def segment_distribution():
    return dashboard_data()["segment_distribution"]


@router.get("/activity")
def activity():
    return dashboard_data()["activity"]
