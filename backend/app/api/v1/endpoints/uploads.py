"""Endpoints for file upload and data management."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List
import pandas as pd

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.data_storage_service import DataStorageService

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV file and return file information."""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        # Read file content
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
        raise HTTPException(status_code=500, detail=str(e))
