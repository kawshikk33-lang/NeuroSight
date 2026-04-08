"""Service for managing uploaded CSV files and metadata storage in the database."""

import io
import uuid
from typing import Any

import pandas as pd
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.data_file import DataFile
from app.services.supabase_client import supabase_client

BUCKET = settings.supabase_bucket

class DataStorageService:
    """Manages uploaded CSV files and provides data access using Supabase Storage."""

    @staticmethod
    def _serialize_data_file(file_record: DataFile) -> dict[str, Any]:
        metadata = file_record.metadata_json or {}
        return {
            "id": file_record.id,
            "dataset_id": file_record.id,
            "name": file_record.display_name,
            "display_name": file_record.display_name,
            "storage_name": file_record.storage_name,
            "size": file_record.size_bytes,
            "size_bytes": file_record.size_bytes,
            "columns": metadata.get("column_count", 0),
            "rows": metadata.get("row_count", 0),
            "column_names": metadata.get("column_names", []),
            "uploadDate": file_record.uploaded_at.isoformat() if file_record.uploaded_at else None,
            "uploaded_at": file_record.uploaded_at.isoformat() if file_record.uploaded_at else None,
            "status": "active",
        }

    @staticmethod
    def _file_query(db: Session, file_identifier: str, user_id: int) -> DataFile | None:
        return (
            db.query(DataFile)
            .filter(
                DataFile.user_id == user_id,
                or_(DataFile.id == file_identifier, DataFile.storage_name == file_identifier),
            )
            .first()
        )

    @staticmethod
    async def save_uploaded_file(
        filename: str,
        file_content: bytes,
        db: Session,
        user_id: int,
    ) -> dict[str, Any]:
        """Save uploaded file to Supabase and persist file metadata in the database."""
        extension = filename.split(".")[-1].lower() if "." in filename else "csv"
        storage_name = f"{uuid.uuid4()}.{extension}"

        await supabase_client.upload_file(BUCKET, storage_name, file_content)

        try:
            df = pd.read_csv(io.BytesIO(file_content))
            metadata = {
                "column_count": len(df.columns),
                "row_count": len(df),
                "column_names": list(df.columns),
            }
            record = DataFile(
                user_id=user_id,
                storage_name=storage_name,
                display_name=filename,
                size_bytes=len(file_content),
                metadata_json=metadata,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return DataStorageService._serialize_data_file(record)
        except Exception as e:
            db.rollback()
            await supabase_client.delete_file(BUCKET, storage_name)
            raise ValueError(f"Failed to parse CSV file: {str(e)}") from e

    @staticmethod
    async def get_file_list(db: Session, user_id: int) -> list[dict[str, Any]]:
        """Get list of uploaded files for a user."""
        files = (
            db.query(DataFile)
            .filter(DataFile.user_id == user_id)
            .order_by(DataFile.uploaded_at.desc())
            .all()
        )
        return [DataStorageService._serialize_data_file(file_record) for file_record in files]

    @staticmethod
    async def get_file_data(file_identifier: str, db: Session, user_id: int) -> pd.DataFrame | None:
        """Get data from a specific file in Supabase by db id or storage name."""
        file_record = DataStorageService._file_query(db, file_identifier, user_id)
        if not file_record:
            return None

        try:
            content = await supabase_client.download_file(BUCKET, file_record.storage_name)
            return pd.read_csv(io.BytesIO(content))
        except Exception as e:
            print(f"Error reading file {file_identifier} from Supabase: {e}")
            return None

    @staticmethod
    async def delete_file(file_identifier: str, db: Session, user_id: int) -> bool:
        """Delete a file from Supabase and remove its database record."""
        file_record = DataStorageService._file_query(db, file_identifier, user_id)
        if not file_record:
            return False

        try:
            await supabase_client.delete_file(BUCKET, file_record.storage_name)
            db.delete(file_record)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False

    @staticmethod
    async def get_combined_data(db: Session, user_id: int) -> pd.DataFrame:
        """Get combined data from all uploaded files for a user."""
        files = await DataStorageService.get_file_list(db=db, user_id=user_id)
        dfs = []

        for file_info in files:
            df = await DataStorageService.get_file_data(file_info["id"], db=db, user_id=user_id)
            if df is not None:
                dfs.append(df)

        if not dfs:
            return pd.DataFrame()

        return pd.concat(dfs, ignore_index=True) if len(dfs) > 1 else dfs[0]
