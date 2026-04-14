"""Data connector endpoints — manage external data source connections."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.data_connector import DataConnector
from app.models.user import User
from app.services.connector_service import ConnectorService

router = APIRouter()


# --- Schemas ---

class ConnectorCreate(BaseModel):
    type: str
    name: str
    config: dict
    sync_frequency: str = "daily"


class TestConnectionRequest(BaseModel):
    type: str
    config: dict


# --- Endpoints ---

@router.get("")
def list_connectors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all connectors for the current user."""
    connectors = (
        db.query(DataConnector)
        .filter(DataConnector.user_id == current_user.id)
        .order_by(desc(DataConnector.created_at))
        .all()
    )

    return [
        {
            "id": c.id,
            "type": c.connector_type,
            "name": c.name,
            "status": c.status,
            "last_sync": c.last_sync_at.isoformat() if c.last_sync_at else None,
            "sync_frequency": c.sync_frequency,
            "config": {k: (v if k != "password" else "••••••") for k, v in c.config.items()},
            "created_at": c.created_at.isoformat(),
        }
        for c in connectors
    ]


@router.post("")
def create_connector(
    payload: ConnectorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new data connector after testing the connection."""
    valid_types = {"database", "facebook_ads", "google_ads"}
    if payload.type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid connector type. Must be one of: {', '.join(valid_types)}")

    # Test connection first
    success, message = ConnectorService.test_connection(payload.type, payload.config)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    # Create connector
    connector = DataConnector(
        user_id=current_user.id,
        name=payload.name,
        connector_type=payload.type,
        config=payload.config,
        sync_frequency=payload.sync_frequency,
        status="connected",
    )
    db.add(connector)
    db.commit()
    db.refresh(connector)

    return {
        "id": connector.id,
        "type": connector.connector_type,
        "name": connector.name,
        "status": connector.status,
        "message": message,
    }


@router.post("/test")
def test_connection(
    payload: TestConnectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test a connector configuration without saving it."""
    valid_types = {"database", "facebook_ads", "google_ads"}
    if payload.type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid connector type. Must be one of: {', '.join(valid_types)}")

    success, message = ConnectorService.test_connection(payload.type, payload.config)
    return {"success": success, "message": message}


@router.post("/{connector_id}/sync")
def sync_connector(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger a data sync for a connector."""
    connector = db.query(DataConnector).filter(
        DataConnector.id == connector_id,
        DataConnector.user_id == current_user.id,
    ).first()

    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    success, message = ConnectorService.sync_data(db, connector)
    db.commit()

    return {"success": success, "message": message}


@router.delete("/{connector_id}")
def delete_connector(
    connector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a connector. Historical synced data is preserved."""
    connector = db.query(DataConnector).filter(
        DataConnector.id == connector_id,
        DataConnector.user_id == current_user.id,
    ).first()

    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    db.delete(connector)
    db.commit()
    return {"success": True}
