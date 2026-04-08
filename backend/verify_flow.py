import httpx
import asyncio
import uuid

async def test_registration():
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    password = "testPassword123!"
    full_name = "Test User"
    
    print(f"Attempting to register: {email}")
    
    async with httpx.AsyncClient() as client:
        try:
            # Registration call
            response = await client.post(
                "http://127.0.0.1:8000/api/v1/auth/register",
                json={
                    "full_name": full_name,
                    "email": email,
                    "password": password
                },
                timeout=15.0
            )
            
            if response.status_code == 200:
                print("✅ Registration successful!")
                user_data = response.json()
                print(f"Created User ID: {user_data.get('id')}")
                print(f"Full Name: {user_data.get('full_name')}")
                
                # Try Login next
                print("\nAttempting to login...")
                login_response = await client.post(
                    "http://127.0.0.1:8000/api/v1/auth/login",
                    json={
                        "email": email,
                        "password": password
                    }
                )
                
                if login_response.status_code == 200:
                    print("✅ Login successful!")
                    tokens = login_response.json()
                    print(f"Got Access Token: {tokens.get('access_token')[:20]}...")
                else:
                    print(f"❌ Login failed ({login_response.status_code}): {login_response.text}")
                    
            else:
                print(f"❌ Registration failed ({response.status_code}): {response.text}")
                
        except Exception as e:
            print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_registration())
