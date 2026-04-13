"""Audit logging service for compliance and security tracking."""
import logging
import uuid
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


class AuditLogger:
    """Centralized audit logging service.

    Usage:
        AuditLogger.log(
            db=db,
            request=request,
            user=current_user,
            event_type="file_upload",
            action="create",
            description="User uploaded sales_data.csv",
            resource_type="file",
            resource_id="abc-123",
            resource_name="sales_data.csv",
            metadata={"size_bytes": 1024},
        )
    """

    @staticmethod
    def log(
        *,
        db: Session,
        request: Request | None = None,
        user: Any = None,
        event_type: str,
        action: str,
        description: str,
        resource_type: str | None = None,
        resource_id: str | None = None,
        resource_name: str | None = None,
        before_state: dict | None = None,
        after_state: dict | None = None,
        metadata: dict | None = None,
        status_code: int | None = None,
        error_message: str | None = None,
        is_sensitive: bool = False,
        retention_days: int = 365,
    ) -> AuditLog:
        """Create an audit log entry. APPEND-ONLY — no updates or deletes."""
        user_id = getattr(user, "id", None) if user else None
        user_email = getattr(user, "email", None) if user else None

        ip_address = None
        user_agent = None
        req_method = None
        path = None

        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            req_method = request.method
            path = request.url.path

        entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            event_type=event_type,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            action=action,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=str(uuid.uuid4()),
            method=req_method,
            path=path,
            before_state=before_state,
            after_state=after_state,
            metadata=metadata or {},
            status_code=status_code,
            error_message=error_message,
            is_sensitive=is_sensitive,
            retention_days=retention_days,
        )

        db.add(entry)
        db.flush()

        logger.info("AUDIT: %s (user=%s, event=%s)", description, user_email, event_type)
        return entry
