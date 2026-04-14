"""Data connector service — test connections and sync data from external sources."""
import logging
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.models.data_connector import DataConnector

logger = logging.getLogger(__name__)


class ConnectorService:
    """Handle testing and syncing of external data connectors."""

    @staticmethod
    def test_connection(connector_type: str, config: dict[str, Any]) -> tuple[bool, str]:
        """Test a connector configuration without saving it.

        Returns (success, message) tuple.
        """
        if connector_type == "database":
            return ConnectorService._test_database(config)
        elif connector_type == "facebook_ads":
            return ConnectorService._test_facebook(config)
        elif connector_type == "google_ads":
            return ConnectorService._test_google_ads(config)
        else:
            return False, f"Unknown connector type: {connector_type}"

    @staticmethod
    def _test_database(config: dict[str, Any]) -> tuple[bool, str]:
        """Test PostgreSQL or MySQL connection."""
        db_type = config.get("db_type", "PostgreSQL")
        host = config.get("host", "")
        port = config.get("port", 5432 if db_type == "PostgreSQL" else 3306)
        database = config.get("database", "")
        username = config.get("username", "")
        password = config.get("password", "")

        if not all([host, database, username, password]):
            return False, "All fields (host, database, username, password) are required"

        if db_type == "PostgreSQL":
            conn_str = f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"
        else:
            conn_str = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"

        try:
            engine = create_engine(conn_str, connect_args={"connect_timeout": 10})
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine.dispose()
            return True, f"Successfully connected to {db_type} database '{database}'"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"

    @staticmethod
    def _test_facebook(config: dict[str, Any]) -> tuple[bool, str]:
        """Test Facebook Ads API connection.

        In production, this would call the Facebook Marketing API.
        For now, validates config format.
        """
        ad_account_id = config.get("ad_account_id", "")
        access_token = config.get("access_token", "")

        if not ad_account_id or not access_token:
            return False, "Ad Account ID and Access Token are required"

        if not ad_account_id.startswith("act_"):
            return False, "Ad Account ID should start with 'act_'"

        # In production: call Facebook Graph API to verify token
        # For now: accept valid format
        if len(access_token) < 20:
            return False, "Access token appears invalid (too short)"

        return True, "Facebook Ads credentials validated"

    @staticmethod
    def _test_google_ads(config: dict[str, Any]) -> tuple[bool, str]:
        """Test Google Ads API connection.

        In production, this would call the Google Ads API.
        For now, validates config format.
        """
        customer_id = config.get("customer_id", "")
        developer_token = config.get("developer_token", "")
        refresh_token = config.get("refresh_token", "")

        if not all([customer_id, developer_token, refresh_token]):
            return False, "Customer ID, Developer Token, and Refresh Token are required"

        # Validate customer ID format (xxx-xxx-xxxx)
        parts = customer_id.replace("-", "").strip()
        if not parts.isdigit() or len(parts) < 7:
            return False, "Customer ID should be in format xxx-xxx-xxxx"

        return True, "Google Ads credentials validated"

    @staticmethod
    def sync_data(db: Session, connector: DataConnector) -> tuple[bool, str]:
        """Sync data from a connector into the system.

        Returns (success, message) tuple.
        """
        connector.status = "syncing"
        db.commit()

        try:
            if connector.connector_type == "database":
                success, message = ConnectorService._sync_database(db, connector)
            elif connector.connector_type == "facebook_ads":
                success, message = ConnectorService._sync_facebook_ads(db, connector)
            elif connector.connector_type == "google_ads":
                success, message = ConnectorService._sync_google_ads(db, connector)
            else:
                success, message = False, f"Unknown connector type: {connector.connector_type}"

            from datetime import datetime

            connector.status = "connected" if success else "error"
            connector.last_sync_at = datetime.now()
            if not success:
                connector.last_error = message
            db.commit()
            return success, message

        except Exception as e:
            connector.status = "error"
            connector.last_error = str(e)
            db.commit()
            return False, str(e)

    @staticmethod
    def _sync_database(db: Session, connector: DataConnector) -> tuple[bool, str]:
        """Pull data from external database and store for analysis."""
        config = connector.config
        db_type = config.get("db_type", "PostgreSQL")
        host = config.get("host", "")
        port = config.get("port", 5432 if db_type == "PostgreSQL" else 3306)
        database = config.get("database", "")
        username = config.get("username", "")
        password = config.get("password", "")

        try:
            conn_str = (
                f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"
                if db_type == "PostgreSQL"
                else f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
            )
            engine = create_engine(conn_str, connect_args={"connect_timeout": 30})

            # Discover tables
            with engine.connect() as conn:
                if db_type == "PostgreSQL":
                    tables = conn.execute(
                        text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
                    ).fetchall()
                else:
                    tables = conn.execute(
                        text("SHOW TABLES")
                    ).fetchall()

            engine.dispose()
            table_names = [t[0] for t in tables]

            return True, f"Connected. Found {len(table_names)} tables: {', '.join(table_names[:5])}"

        except Exception as e:
            return False, f"Sync failed: {str(e)}"

    @staticmethod
    def _sync_facebook_ads(db: Session, connector: DataConnector) -> tuple[bool, str]:
        """Pull Facebook Ads data."""
        # In production: call Facebook Marketing API
        # For now: placeholder
        return True, "Facebook Ads sync completed (placeholder — API integration pending)"

    @staticmethod
    def _sync_google_ads(db: Session, connector: DataConnector) -> tuple[bool, str]:
        """Pull Google Ads data."""
        # In production: call Google Ads API
        # For now: placeholder
        return True, "Google Ads sync completed (placeholder — API integration pending)"
