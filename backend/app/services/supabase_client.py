import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

class SupabaseClient:
    """Lightweight custom client for Supabase Auth and Storage."""
    
    def __init__(self):
        self.url = settings.supabase_url
        self.key = settings.supabase_key
        # Service headers are used for privileged backend operations.
        self.service_headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}"
        }

        # Auth endpoints (/auth/v1/signup, /auth/v1/token) expect API key headers.
        # Sending a service-role bearer token can lead to 401/permission issues.
        self.auth_headers = {
            "apikey": self.key,
            "Content-Type": "application/json",
        }

    # Auth Methods
    async def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/auth/v1/signup",
                json={"email": email, "password": password},
                headers=self.auth_headers
            )
            response.raise_for_status()
            return response.json()

    async def create_user_admin(
        self,
        email: str,
        password: str,
        *,
        email_confirm: bool = True,
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/auth/v1/admin/users",
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": email_confirm,
                },
                headers={**self.auth_headers, **self.service_headers},
            )
            response.raise_for_status()
            return response.json()

    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/auth/v1/token?grant_type=password",
                json={"email": email, "password": password},
                headers=self.auth_headers
            )
            response.raise_for_status()
            return response.json()

    async def refresh_session(self, refresh_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/auth/v1/token?grant_type=refresh_token",
                json={"refresh_token": refresh_token},
                headers=self.auth_headers,
            )
            response.raise_for_status()
            return response.json()

    async def get_user(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/auth/v1/user",
                headers={
                    "apikey": self.key,
                    "Authorization": f"Bearer {access_token}",
                },
            )
            response.raise_for_status()
            return response.json()

    # Storage Methods
    async def upload_file(self, bucket: str, path: str, content: bytes, content_type: str = "text/csv") -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            storage_headers = {**self.service_headers, "Content-Type": content_type}
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
                headers=self.service_headers
            )
            response.raise_for_status()
            return response.content

    async def delete_file(self, bucket: str, path: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.url}/storage/v1/object/{bucket}/{path}",
                headers=self.service_headers
            )
            response.raise_for_status()
            return response.json()

supabase_client = SupabaseClient()
