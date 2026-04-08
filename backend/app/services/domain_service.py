def dashboard_data():
    return {
        "kpis": {"revenue": 124500, "customers": 3290, "growth": 12.4},
        "forecast_trend": [{"month": "Jan", "value": 21000}, {"month": "Feb", "value": 22300}],
        "segment_distribution": [
            {"segment": "Champions", "count": 420, "percentage": 24.5},
            {"segment": "Loyal", "count": 510, "percentage": 29.7},
        ],
        "activity": [{"title": "Model retraining completed", "time": "2h ago"}],
    }


def analytics_data():
    return {
        "forecast_trend": [{"date": "2026-04-01", "value": 1024}],
        "segment_trend": [{"week": "2026-W14", "champions": 400}],
        "insights": [{"title": "Demand rising", "detail": "Upward trend in Q2"}],
    }


def model_data():
    return {
        "active": {"id": "forecast-v3", "task": "forecast"},
        "versions": [{"id": "forecast-v3", "status": "active"}],
        "metrics": {"rmse": 120.4, "mae": 83.2, "mape": 5.1, "r2": 0.89},
        "feature_importance": [{"feature": "quantity", "importance": 0.31}],
    }
