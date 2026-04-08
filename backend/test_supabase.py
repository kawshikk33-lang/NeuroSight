import asyncio
import os
from app.services.supabase_client import supabase_client
from app.core.config import settings

async def test_connection():
    print("--- Supabase connection Test ---")
    print(f"URL: {settings.supabase_url}")
    print(f"Key: {'*' * 10 if settings.supabase_key else 'MISSING'}")
    
    if not settings.supabase_url or not settings.supabase_key:
        print("❌ Error: Supabase URL or Key is missing in settings.")
        return

    try:
        # Test Storage: Try to upload a dummy file to verify the bucket
        print("\nTesting Storage (Upload)...")
        test_content = b"health check"
        await supabase_client.upload_file(settings.supabase_bucket, "health_check.txt", test_content, "text/plain")
        print("✅ Storage: Successfully uploaded health_check.txt.")
        
        # Test Storage: Try to download it back
        print("Testing Storage (Download)...")
        back = await supabase_client.download_file(settings.supabase_bucket, "health_check.txt")
        if back == test_content:
            print("✅ Storage: Download verification successful.")
        
    except Exception as e:
        print(f"❌ Storage Error: {e}")
        
    print("\n--- Test Complete ---")

if __name__ == "__main__":
    asyncio.run(test_connection())
