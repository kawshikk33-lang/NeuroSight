"""Service for managing uploaded CSV files and data storage."""

import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Directory for storing uploaded files
UPLOAD_DIR = Path("./uploads")
DATA_INDEX_FILE = UPLOAD_DIR / "data_index.json"


class DataStorageService:
    """Manages uploaded CSV files and provides data access."""

    @staticmethod
    def ensure_upload_dir():
        """Create upload directory if it doesn't exist."""
        UPLOAD_DIR.mkdir(exist_ok=True)
        if not DATA_INDEX_FILE.exists():
            DATA_INDEX_FILE.write_text(json.dumps({}))

    @staticmethod
    def save_uploaded_file(filename: str, file_content: bytes) -> Dict[str, Any]:
        """Save uploaded file and update index."""
        DataStorageService.ensure_upload_dir()
        
        # Clean filename and create unique name
        safe_filename = filename.replace(" ", "_")
        file_path = UPLOAD_DIR / safe_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Read and parse CSV to get metadata
        try:
            df = pd.read_csv(file_path)
            file_info = {
                "id": safe_filename,
                "name": filename,
                "size": len(file_content),
                "columns": len(df.columns),
                "rows": len(df),
                "column_names": list(df.columns),
                "uploadDate": datetime.now().isoformat(),
                "status": "active"
            }
            
            # Update index
            index = json.loads(DATA_INDEX_FILE.read_text())
            index[safe_filename] = file_info
            DATA_INDEX_FILE.write_text(json.dumps(index, indent=2))
            
            return file_info
        except Exception as e:
            # Clean up on error
            if file_path.exists():
                file_path.unlink()
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

    @staticmethod
    def get_file_list() -> List[Dict[str, Any]]:
        """Get list of all uploaded files."""
        DataStorageService.ensure_upload_dir()
        index = json.loads(DATA_INDEX_FILE.read_text())
        return list(index.values())

    @staticmethod
    def get_file_data(filename: str) -> Optional[pd.DataFrame]:
        """Get data from a specific file."""
        DataStorageService.ensure_upload_dir()
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            return None
        
        try:
            return pd.read_csv(file_path)
        except Exception as e:
            print(f"Error reading file {filename}: {e}")
            return None

    @staticmethod
    def delete_file(filename: str) -> bool:
        """Delete a file and remove from index."""
        DataStorageService.ensure_upload_dir()
        file_path = UPLOAD_DIR / filename
        
        if file_path.exists():
            file_path.unlink()
            
            index = json.loads(DATA_INDEX_FILE.read_text())
            if filename in index:
                del index[filename]
                DATA_INDEX_FILE.write_text(json.dumps(index, indent=2))
            
            return True
        return False

    @staticmethod
    def get_combined_data() -> pd.DataFrame:
        """Get combined data from all active files."""
        DataStorageService.ensure_upload_dir()
        dfs = []
        
        for filename, info in json.loads(DATA_INDEX_FILE.read_text()).items():
            if info.get("status") == "active":
                df = DataStorageService.get_file_data(filename)
                if df is not None:
                    dfs.append(df)
        
        if not dfs:
            return pd.DataFrame()
        
        return pd.concat(dfs, ignore_index=True) if len(dfs) > 1 else dfs[0]
