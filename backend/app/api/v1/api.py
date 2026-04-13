from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    alerts,
    analytics,
    audit,
    auth,
    dashboard,
    forecast,
    models,
    rfmq,
    uploads,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
api_router.include_router(rfmq.router, prefix="/rfmq", tags=["rfmq"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit", "compliance"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts", "notifications"])
