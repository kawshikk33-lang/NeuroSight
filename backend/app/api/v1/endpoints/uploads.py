"""Endpoints for file upload and data management."""

import csv
import io
from typing import List

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.data_storage_service import DataStorageService

router = APIRouter()

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls", "xlsm"}
ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
}


def _validate_file(file: UploadFile) -> None:
    """Validate file extension, MIME type, size, and content."""
    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="File must have a valid extension")

    extension = file.filename.rsplit(".", 1)[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Only CSV or Excel files ({', '.join(ALLOWED_EXTENSIONS)}) are allowed",
        )

    # Check MIME type if provided
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # Read and validate size
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024 * 1024):.0f} MB",
        )

    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Validate content based on extension
    try:
        if extension == "csv":
            # Try to parse as CSV to validate content
            text_content = content.decode("utf-8")
            reader = csv.reader(io.StringIO(text_content))
            rows = list(reader)
            if len(rows) < 2:
                raise HTTPException(status_code=400, detail="CSV file must have a header row and at least one data row")
        else:
            # Try to parse as Excel file
            pd.read_excel(io.BytesIO(content), nrows=1)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not a valid CSV (encoding error)")
    except Exception:
        raise HTTPException(status_code=400, detail=f"File content is not valid {extension.upper()} format")

    # Reset file pointer after validation
    file.file.seek(0)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV/Excel file and return file information."""
    # Validate file (extension, MIME, size, content)
    _validate_file(file)

    try:
        # Read file content (after validation reset pointer)
        content = await file.read()

        # Save file and get metadata
        file_info = await DataStorageService.save_uploaded_file(
            file.filename,
            content,
            db=db,
            user_id=current_user.id,
        )

        return {
            "success": True,
            "file": file_info
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/files")
async def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Get list of all uploaded files."""
    try:
        files = await DataStorageService.get_file_list(db=db, user_id=current_user.id)
        return files
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{filename}/preview")
async def preview_file(
    filename: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a preview of file data (first N rows)."""
    try:
        df = await DataStorageService.get_file_data(filename, db=db, user_id=current_user.id)
        if df is None:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Return first N rows as JSON
        return {
            "filename": filename,
            "total_rows": len(df),
            "columns": list(df.columns),
            "preview": df.head(limit).to_dict('records')
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data")
async def get_combined_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get combined data from all active files."""
    try:
        df = await DataStorageService.get_combined_data(db=db, user_id=current_user.id)
        
        if df.empty:
            return {
                "success": False,
                "message": "No uploaded files available",
                "data": []
            }
        
        return {
            "success": True,
            "total_rows": len(df),
            "columns": list(df.columns),
            "data": df.to_dict('records')[:100]  # Return first 100 rows
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{filename}")
async def delete_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an uploaded file."""
    try:
        if await DataStorageService.delete_file(filename, db=db, user_id=current_user.id):
            return {"success": True, "message": f"File {filename} deleted"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
