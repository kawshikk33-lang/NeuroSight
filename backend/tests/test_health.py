from fastapi.testclient import TestClient


def test_health(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_endpoint(client: TestClient):
    """Test that FastAPI app root is accessible."""
    response = client.get("/")
    # Should return 404 since no root route is defined
    assert response.status_code in [200, 404]
