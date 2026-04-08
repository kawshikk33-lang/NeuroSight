"""Service for managing uploaded CSV files and data storage via Supabase."""

import io
import json
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.services.supabase_client import supabase_client
from app.core.config import settings

BUCKET = settings.supabase_bucket

class DataStorageService:
    """Manages uploaded CSV files and provides data access using Supabase Storage."""

    @staticmethod
    async def get_index() -> Dict[str, Any]:
        """Fetch the data index from Supabase Storage."""
        try:
            content = await supabase_client.download_file(BUCKET, "data_index.json")
            return json.loads(content)
        except Exception:
            # If not found or empty, return default empty index
            return {}

    @staticmethod
    async def save_index(index: Dict[str, Any]):
        """Save the data index to Supabase Storage."""
        content = json.dumps(index, indent=2).encode()
        await supabase_client.upload_file(BUCKET, "data_index.json", content, "application/json")

    @staticmethod
    async def save_uploaded_file(filename: str, file_content: bytes) -> Dict[str, Any]:
        """Save uploaded file to Supabase and update index."""
        safe_filename = filename.replace(" ", "_")
        
        # Upload to Supabase
        await supabase_client.upload_file(BUCKET, safe_filename, file_content)
        
        # Read metadata using pandas
        try:
            df = pd.read_csv(io.BytesIO(file_content))
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
            index = await DataStorageService.get_index()
            index[safe_filename] = file_info
            await DataStorageService.save_index(index)
            
            return file_info
        except Exception as e:
            # Cleanup on error
            await supabase_client.delete_file(BUCKET, safe_filename)
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

    @staticmethod
    async def get_file_list() -> List[Dict[str, Any]]:
        """Get list of all uploaded files."""
        index = await DataStorageService.get_index()
        return list(index.values())

    @staticmethod
    async def get_file_data(filename: str) -> Optional[pd.DataFrame]:
        """Get data from a specific file in Supabase."""
        try:
            content = await supabase_client.download_file(BUCKET, filename)
            return pd.read_csv(io.BytesIO(content))
        except Exception as e:
            print(f"Error reading file {filename} from Supabase: {e}")
            return None

    @staticmethod
    async def delete_file(filename: str) -> bool:
        """Delete a file from Supabase and remove from index."""
        try:
            await supabase_client.delete_file(BUCKET, filename)
            
            index = await DataStorageService.get_index()
            if filename in index:
                del index[filename]
                await DataStorageService.save_index(index)
            return True
        except Exception:
            return False

    @staticmethod
    async def get_combined_data() -> pd.DataFrame:
        """Get combined data from all active files in Supabase."""
        index = await DataStorageService.get_index()
        dfs = []
        
        for filename, info in index.items():
            if info.get("status") == "active":
                df = await DataStorageService.get_file_data(filename)
                if df is not None:
                    dfs.append(df)
        
        if not dfs:
            return pd.DataFrame()
        
        return pd.concat(dfs, ignore_index=True) if len(dfs) > 1 else dfs[0]
