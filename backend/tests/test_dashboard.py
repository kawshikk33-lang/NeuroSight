"""Tests for dashboard endpoints."""
from fastapi.testclient import TestClient


class TestDashboardKPIs:
    """Test GET /api/v1/dashboard/kpis."""

    def test_get_kpis(self, client, auth_headers, mock_supabase_client, test_user):
        """Test KPI endpoint returns data."""
        response = client.get("/api/v1/dashboard/kpis", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Should return mock KPI data
        assert isinstance(data, (list, dict))


class TestDashboardForecastTrend:
    """Test GET /api/v1/dashboard/forecast-trend."""

    def test_get_forecast_trend(self, client):
        """Test forecast trend endpoint returns data."""
        response = client.get("/api/v1/dashboard/forecast-trend")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))


class TestDashboardSegmentDistribution:
    """Test GET /api/v1/dashboard/segment-distribution."""

    def test_get_segment_distribution(self, client):
        """Test segment distribution endpoint returns data."""
        response = client.get("/api/v1/dashboard/segment-distribution")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))


class TestDashboardActivity:
    """Test GET /api/v1/dashboard/activity."""

    def test_get_activity(self, client):
        """Test activity endpoint returns data."""
        response = client.get("/api/v1/dashboard/activity")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))
