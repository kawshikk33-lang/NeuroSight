"""Smart alerts and notification endpoints."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.alert_rule import AlertNotification, AlertRule
from app.models.user import User
from app.services.alert_service import AlertService

router = APIRouter()


# --- Schemas ---

class AlertRuleCreate(BaseModel):
    name: str
    metric: str
    condition: str  # above, below, equal, anomaly
    threshold_value: float | None = None
    notification_type: str = "in_app"
    use_anomaly_detection: bool = False
    anomaly_std_devs: int = 3
    cooldown_seconds: int = 300
    description: str | None = None


class AlertRuleUpdate(BaseModel):
    name: str | None = None
    condition: str | None = None
    threshold_value: float | None = None
    is_active: bool | None = None
    notification_type: str | None = None
    use_anomaly_detection: bool | None = None
    anomaly_std_devs: int | None = None
    cooldown_seconds: int | None = None
    description: str | None = None


# --- Alert Rules CRUD ---

@router.post("/rules")
def create_rule(
    payload: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new alert rule."""
    if payload.condition not in ("above", "below", "equal", "anomaly"):
        raise HTTPException(status_code=400, detail="Invalid condition. Must be: above, below, equal, anomaly")

    if payload.condition != "anomaly" and payload.threshold_value is None:
        raise HTTPException(status_code=400, detail="threshold_value is required for non-anomaly conditions")

    rule = AlertRule(
        user_id=current_user.id,
        name=payload.name,
        metric=payload.metric.lower(),
        condition=payload.condition,
        threshold_value=payload.threshold_value,
        notification_type=payload.notification_type,
        use_anomaly_detection=payload.use_anomaly_detection,
        anomaly_std_devs=payload.anomaly_std_devs,
        cooldown_seconds=payload.cooldown_seconds,
        description=payload.description,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    return {
        "id": rule.id,
        "name": rule.name,
        "metric": rule.metric,
        "condition": rule.condition,
        "threshold_value": rule.threshold_value,
        "is_active": rule.is_active,
        "notification_type": rule.notification_type,
        "use_anomaly_detection": rule.use_anomaly_detection,
        "cooldown_seconds": rule.cooldown_seconds,
        "description": rule.description,
        "created_at": rule.created_at.isoformat(),
        "last_triggered_at": rule.last_triggered_at.isoformat() if rule.last_triggered_at else None,
    }


@router.get("/rules")
def list_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all alert rules for the current user."""
    rules = (
        db.query(AlertRule)
        .filter(AlertRule.user_id == current_user.id)
        .order_by(AlertRule.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "name": r.name,
            "metric": r.metric,
            "condition": r.condition,
            "threshold_value": r.threshold_value,
            "is_active": r.is_active,
            "notification_type": r.notification_type,
            "use_anomaly_detection": r.use_anomaly_detection,
            "cooldown_seconds": r.cooldown_seconds,
            "description": r.description,
            "created_at": r.created_at.isoformat(),
            "last_triggered_at": r.last_triggered_at.isoformat() if r.last_triggered_at else None,
        }
        for r in rules
    ]


@router.put("/rules/{rule_id}")
def update_rule(
    rule_id: str,
    payload: AlertRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an alert rule."""
    rule = db.query(AlertRule).filter(
        AlertRule.id == rule_id,
        AlertRule.user_id == current_user.id,
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)

    return {"success": True, "rule_id": rule.id}


@router.delete("/rules/{rule_id}")
def delete_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an alert rule and its notifications."""
    rule = db.query(AlertRule).filter(
        AlertRule.id == rule_id,
        AlertRule.user_id == current_user.id,
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return {"success": True}


# --- Notifications ---

@router.get("/notifications")
def list_notifications(
    unread_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List alert notifications for the current user."""
    query = db.query(AlertNotification).filter(AlertNotification.user_id == current_user.id)

    if unread_only:
        query = query.filter(AlertNotification.is_read == False)

    total = query.count()

    notifications = (
        query
        .order_by(AlertNotification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "notifications": [
            {
                "id": n.id,
                "rule_id": n.rule_id,
                "metric": n.metric,
                "current_value": n.current_value,
                "threshold_value": n.threshold_value,
                "condition": n.condition,
                "title": n.title,
                "message": n.message,
                "severity": n.severity,
                "trend": n.trend,
                "recommended_action": n.recommended_action,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        "total": total,
        "unread": (
            db.query(AlertNotification)
            .filter(AlertNotification.user_id == current_user.id, AlertNotification.is_read == False)
            .count()
        ),
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notif = db.query(AlertNotification).filter(
        AlertNotification.id == notification_id,
        AlertNotification.user_id == current_user.id,
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"success": True}


@router.put("/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    db.query(AlertNotification).filter(
        AlertNotification.user_id == current_user.id,
        AlertNotification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"success": True}


# --- Stats & Check ---

@router.get("/stats")
def get_stats(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get alert statistics."""
    return AlertService.get_stats(db, current_user.id, days)


@router.post("/check")
def manual_check(
    metric: str = Query(...),
    value: float = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger alert check for a specific metric value.

    Useful for testing or integrating with external data sources.
    """
    triggered = AlertService.check_and_trigger(
        db=db,
        user_id=current_user.id,
        metric=metric.lower(),
        current_value=value,
    )

    db.commit()

    return {
        "metric": metric,
        "value": value,
        "alerts_triggered": len(triggered),
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "severity": n.severity,
            }
            for n in triggered
        ],
    }


# --- Available Metrics ---

@router.get("/available-metrics")
def get_available_metrics():
    """Get list of metrics that can be monitored."""
    return {
        "metrics": {
            "revenue": {"label": "Revenue", "unit": "$", "description": "Total revenue"},
            "customers": {"label": "Customers", "unit": "", "description": "Total customer count"},
            "growth": {"label": "Growth Rate", "unit": "%", "description": "Growth percentage"},
            "churn_rate": {"label": "Churn Rate", "unit": "%", "description": "Customer churn percentage"},
            "rmse": {"label": "RMSE", "unit": "", "description": "Root Mean Square Error"},
            "mape": {"label": "MAPE", "unit": "%", "description": "Mean Absolute Percentage Error"},
            "r2": {"label": "R² Score", "unit": "", "description": "Model R-squared"},
            "forecast_value": {"label": "Forecast Value", "unit": "$", "description": "Predicted forecast value"},
            "active_customers": {"label": "Active Customers", "unit": "", "description": "Number of active customers"},
        }
    }
