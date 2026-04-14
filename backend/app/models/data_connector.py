import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DataConnector(Base):
    """External data source connector (database, Facebook Ads, Google Ads)."""

    __tablename__ = "data_connectors"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    connector_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # database, facebook_ads, google_ads

    # Encrypted config (credentials, host, etc.) stored as JSON
    config: Mapped[dict] = mapped_column(JSON, default=dict)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="disconnected")  # connected, error, syncing, disconnected
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_frequency: Mapped[str] = mapped_column(String(20), default="daily")  # hourly, 6hours, daily, weekly
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", foreign_keys=[user_id])
