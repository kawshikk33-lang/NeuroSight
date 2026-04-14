"""Test configuration and fixtures for NeuroSight backend."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.models.user import User


# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Test client with overridden database dependency."""

    from app.db.session import get_db
    
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client to avoid external API calls."""
    from app.services.supabase_client import supabase_client
    
    with patch.object(supabase_client, "sign_in", new_callable=AsyncMock) as mock_sign_in, \
         patch.object(supabase_client, "sign_up", new_callable=AsyncMock) as mock_sign_up, \
         patch.object(supabase_client, "get_user", new_callable=AsyncMock) as mock_get_user, \
         patch.object(supabase_client, "refresh_session", new_callable=AsyncMock) as mock_refresh:
         
        mock_sign_in.return_value = {
            "access_token": "test-access-token",
            "refresh_token": "test-refresh-token",
            "user": {"email": "test@example.com", "id": "test-user-id"},
        }
        mock_sign_up.return_value = {
            "access_token": "test-access-token",
            "refresh_token": "test-refresh-token",
            "user": {"email": "newuser@example.com", "id": "new-user-id"},
        }
        mock_get_user.return_value = {
            "email": "test@example.com",
            "id": "test-user-id",
        }
        mock_refresh.return_value = {
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
        }
        yield supabase_client


@pytest.fixture
def test_user(db_session):
    """Create a test user in the database."""
    from app.core.security import get_password_hash
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword"),
        role="viewer",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session):
    """Create an admin user in the database."""
    from app.core.security import get_password_hash
    user = User(
        email="admin@example.com",
        full_name="Admin User",
        hashed_password=get_password_hash("adminpassword"),
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers():
    """Return headers with a mock auth token."""
    return {"Authorization": "Bearer test-access-token"}
