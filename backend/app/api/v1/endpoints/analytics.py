from fastapi import APIRouter

from app.services.domain_service import analytics_data

router = APIRouter()


@router.get("/forecast-trend")
def forecast_trend():
    return analytics_data()["forecast_trend"]


@router.get("/segment-trend")
def segment_trend():
    return analytics_data()["segment_trend"]


@router.get("/insights")
def insights():
    return analytics_data()["insights"]
