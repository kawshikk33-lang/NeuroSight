import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

class SupabaseClient:
    """Lightweight custom client for Supabase Auth and Storage."""
    
    def __init__(self):
        self.url = settings.supabase_url
        self.key = settings.supabase_key
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}"
        }

    # Auth Methods
    async def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/auth/v1/signup",
                json={"email": email, "password": password},
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/auth/v1/token?grant_type=password",
                json={"email": email, "password": password},
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    # Storage Methods
    async def upload_file(self, bucket: str, path: str, content: bytes, content_type: str = "text/csv") -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            storage_headers = {**self.headers, "Content-Type": content_type}
            response = await client.post(
                f"{self.url}/storage/v1/object/{bucket}/{path}",
                content=content,
                headers=storage_headers
            )
            response.raise_for_status()
            return response.json()

    async def download_file(self, bucket: str, path: str) -> bytes:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/storage/v1/object/{bucket}/{path}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.content

    async def delete_file(self, bucket: str, path: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.url}/storage/v1/object/{bucket}/{path}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

supabase_client = SupabaseClient()
