import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AlertRule(Base):
    """User-defined alert rule: trigger when a metric crosses a threshold."""

    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Rule definition
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    metric: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    condition: Mapped[str] = mapped_column(String(20), nullable=False)  # above, below, equal, anomaly
    threshold_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Notification config
    notification_type: Mapped[str] = mapped_column(
        String(20), default="in_app"
    )  # in_app, email, both

    # Smart baseline
    use_anomaly_detection: Mapped[bool] = mapped_column(Boolean, default=False)
    anomaly_std_devs: Mapped[int] = mapped_column(Integer, default=3)  # 3σ

    # Cooldown to prevent alert spam (seconds)
    cooldown_seconds: Mapped[int] = mapped_column(Integer, default=300)

    # Metadata
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_triggered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user = relationship("User", foreign_keys=[user_id])
    notifications = relationship("AlertNotification", back_populates="rule", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_alert_rules_user_metric", "user_id", "metric"),
        Index("ix_alert_rules_active", "user_id", "is_active"),
    )


class AlertNotification(Base):
    """Triggered alert notification (one per rule firing)."""

    __tablename__ = "alert_notifications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rule_id: Mapped[str] = mapped_column(
        ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # What triggered it
    metric: Mapped[str] = mapped_column(String(100), nullable=False)
    current_value: Mapped[float] = mapped_column(Float, nullable=False)
    threshold_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    condition: Mapped[str] = mapped_column(String(20), nullable=False)

    # Message
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), default="warning"
    )  # info, warning, critical

    # Context
    trend: Mapped[str | None] = mapped_column(String(50), nullable=True)
    recommended_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    context_data: Mapped[dict] = mapped_column(
        "context", String(2048), default="{}"
    )

    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    user = relationship("User", foreign_keys=[user_id])
    rule = relationship("AlertRule", back_populates="notifications")

    __table_args__ = (
        Index("ix_alert_notifications_user_read", "user_id", "is_read"),
        Index("ix_alert_notifications_created", "user_id", "created_at"),
    )
