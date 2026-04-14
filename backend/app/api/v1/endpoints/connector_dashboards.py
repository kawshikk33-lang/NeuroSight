"""Connector dashboard data endpoints — returns chart data for each connector dashboard."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.data_connector import DataConnector
from app.models.user import User

router = APIRouter()


@router.get("/database/{connector_id}")
def database_dashboard_data(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return dashboard data for a database connector."""
    connector = db.query(DataConnector).filter(
        DataConnector.id == connector_id,
        DataConnector.user_id == current_user.id,
    ).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    # Mock data — will be replaced with real SQL queries when connector is active
    return {
        "kpis": {
            "revenue": {"value": 450000, "change": 12.3, "positive": True},
            "orders": {"value": 1247, "change": 8.2, "positive": True},
            "customers": {"value": 892, "change": 5.1, "positive": True},
            "avg_order": {"value": 2250, "change": -2.1, "positive": False},
        },
        "revenue_trend": [],
        "order_status": [],
        "top_products": [],
        "recent_orders": [],
        "tables": [],
    }


@router.get("/facebook/{connector_id}")
def facebook_dashboard_data(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return dashboard data for a Facebook Ads connector."""
    connector = db.query(DataConnector).filter(
        DataConnector.id == connector_id,
        DataConnector.user_id == current_user.id,
    ).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    return {
        "kpis": {
            "ad_spend": 85000,
            "impressions": 2400000,
            "clicks": 48200,
            "purchases": 1847,
            "ctr": 2.01,
            "cpc": 1.76,
            "cpp": 46.02,
            "roas": 2.8,
        },
        "spend_vs_revenue": [],
        "campaigns": [],
        "demographics": [],
        "creatives": [],
        "geographic": [],
        "insights": [],
    }


@router.get("/google/{connector_id}")
def google_dashboard_data(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return dashboard data for a Google Ads connector."""
    connector = db.query(DataConnector).filter(
        DataConnector.id == connector_id,
        DataConnector.user_id == current_user.id,
    ).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    return {
        "kpis": {
            "ad_spend": 32000,
            "clicks": 12450,
            "conversions": 847,
            "conversion_rate": 6.8,
            "cpc": 2.57,
            "cpa": 37.78,
            "quality_score": 7.2,
            "roas": 3.1,
        },
        "spend_conversions_trend": [],
        "campaigns": [],
        "search_terms": [],
        "device_breakdown": [],
        "quality_score_dist": [],
        "insights": [],
    }


@router.get("/unified-roi")
def unified_roi(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return unified ROI data combining all active connectors."""
    connectors = db.query(DataConnector).filter(
        DataConnector.user_id == current_user.id,
        DataConnector.status == "connected",
    ).all()

    if len(connectors) < 2:
        return {"available": False, "message": "Connect at least 2 data sources for unified ROI"}

    return {
        "available": True,
        "total_revenue": 450000,
        "total_ad_spend": 117000,
        "blended_roas": 3.85,
        "cpa": 585,
        "channels": [
            {"name": "Facebook", "roas": 4.2, "spend": 85000, "revenue": 357000},
            {"name": "Google", "roas": 3.1, "spend": 32000, "revenue": 99200},
        ],
        "recommendation": "Facebook ads drive 35% more revenue per taka spent than Google. Consider shifting ৳10,000 from Google to Facebook for estimated +৳42,000 revenue.",
    }
