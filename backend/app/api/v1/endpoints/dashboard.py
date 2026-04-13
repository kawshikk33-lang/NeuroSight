from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.alert_service import AlertService
from app.services.domain_service import dashboard_data

router = APIRouter()


@router.get("/kpis")
def kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = dashboard_data()["kpis"]

    # Check alert rules for each KPI metric
    for metric, value in data.items():
        if isinstance(value, (int, float)):
            AlertService.check_and_trigger(
                db=db,
                user_id=current_user.id,
                metric=metric,
                current_value=float(value),
            )

    db.commit()
    return data


@router.get("/forecast-trend")
def forecast_trend():
    return dashboard_data()["forecast_trend"]


@router.get("/segment-distribution")
def segment_distribution():
    return dashboard_data()["segment_distribution"]


@router.get("/activity")
def activity():
    return dashboard_data()["activity"]
