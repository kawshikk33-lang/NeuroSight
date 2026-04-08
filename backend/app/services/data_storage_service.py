"""Service for managing uploaded tabular files and metadata storage in the database."""

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
    """Manages uploaded CSV/Excel files and provides data access using Supabase Storage."""

    SUPPORTED_EXTENSIONS = {"csv", "xlsx", "xls", "xlsm"}
    EXCEL_CONTENT_TYPES = {
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
    }

    @staticmethod
    def _extension_from_name(filename: str) -> str:
        return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    @staticmethod
    def _read_dataframe(file_content: bytes, extension: str) -> pd.DataFrame:
        buffer = io.BytesIO(file_content)
        if extension == "csv":
            try:
                return pd.read_csv(buffer)
            except Exception:
                buffer.seek(0)
                return pd.read_csv(buffer, encoding="latin1")
        if extension in {"xlsx", "xlsm"}:
            return pd.read_excel(buffer, engine="openpyxl")
        if extension == "xls":
            try:
                return pd.read_excel(buffer, engine="xlrd")
            except Exception:
                buffer.seek(0)
                return pd.read_excel(buffer, engine="openpyxl")
        raise ValueError(f"Unsupported file extension: {extension}")

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
        extension = DataStorageService._extension_from_name(filename)
        if extension not in DataStorageService.SUPPORTED_EXTENSIONS:
            supported = ", ".join(sorted(DataStorageService.SUPPORTED_EXTENSIONS))
            raise ValueError(f"Unsupported file type. Allowed extensions: {supported}")

        try:
            df = DataStorageService._read_dataframe(file_content, extension)
        except Exception as e:
            raise ValueError(f"Failed to parse uploaded file: {str(e)}") from e

        metadata = {
            "column_count": len(df.columns),
            "row_count": len(df),
            "column_names": list(df.columns),
        }

        storage_name = f"{uuid.uuid4()}.{extension}"
        content_type = DataStorageService.EXCEL_CONTENT_TYPES.get(extension, "text/csv")

        try:
            await supabase_client.upload_file(BUCKET, storage_name, file_content, content_type=content_type)
        except Exception as e:
            raise ValueError(f"Failed to upload file to storage: {str(e)}") from e

        try:
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
            try:
                await supabase_client.delete_file(BUCKET, storage_name)
            except Exception:
                # Keep parse/validation error as primary failure signal.
                pass
            raise ValueError(f"Failed to save file metadata: {str(e)}") from e

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
            extension = DataStorageService._extension_from_name(file_record.storage_name)
            return DataStorageService._read_dataframe(content, extension)
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
