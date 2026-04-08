import json
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BusinessForecasting API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    
    # Database
    database_url: str = "sqlite:///./neuro_sight.db"
    supabase_db_url: str = ""
    
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_bucket: str = "data"
    
    # MLflow
    mlflow_tracking_uri: str = "sqlite:///./mlflow.db"
    mlflow_s3_endpoint_url: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # CORS
    cors_origins: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            raw = v.strip()
            if not raw:
                return []
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass
            return [i.strip() for i in raw.split(",") if i.strip()]
        raise ValueError(v)

    @model_validator(mode="after")
    def apply_database_fallback(self):
        # Prefer explicit DATABASE_URL; otherwise use SUPABASE_DB_URL when provided.
        if self.database_url == "sqlite:///./neuro_sight.db" and self.supabase_db_url:
            self.database_url = self.supabase_db_url

        # psycopg2 rejects some Supabase query params (e.g., pgbouncer=true).
        if self.database_url.startswith("postgresql"):
            self.database_url = self._sanitize_postgres_url(self.database_url)
        return self

    @staticmethod
    def _sanitize_postgres_url(url: str) -> str:
        parts = urlsplit(url)
        allowed = {"sslmode", "application_name", "connect_timeout", "options", "keepalives", "keepalives_idle", "keepalives_interval", "keepalives_count", "target_session_attrs", "gssencmode", "channel_binding", "sslrootcert", "sslcert", "sslkey", "sslcrl"}
        query_items = parse_qsl(parts.query, keep_blank_values=True)
        filtered_query = urlencode([(k, v) for k, v in query_items if k in allowed], doseq=True)
        return urlunsplit((parts.scheme, parts.netloc, parts.path, filtered_query, parts.fragment))

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
