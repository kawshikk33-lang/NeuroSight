"""Endpoints for file upload and data management."""

from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List
import pandas as pd

from app.services.data_storage_service import DataStorageService

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV file and return file information."""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        # Read file content
        content = await file.read()
        
        # Save file and get metadata
        file_info = DataStorageService.save_uploaded_file(file.filename, content)
        
        return {
            "success": True,
            "file": file_info
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/files")
def list_files() -> List[dict]:
    """Get list of all uploaded files."""
    try:
        files = DataStorageService.get_file_list()
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{filename}/preview")
def preview_file(filename: str, limit: int = 10):
    """Get a preview of file data (first N rows)."""
    try:
        df = DataStorageService.get_file_data(filename)
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


@router.delete("/files/{filename}")
def delete_file(filename: str):
    """Delete an uploaded file."""
    try:
        if DataStorageService.delete_file(filename):
            return {"success": True, "message": f"File {filename} deleted"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data")
def get_combined_data():
    """Get combined data from all active files."""
    try:
        df = DataStorageService.get_combined_data()
        
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
