"""
Test script to verify environment variables are loaded correctly.
Run: python test_config.py
"""
import sys
import io
from app.config import settings

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 60)
print("Guardian Configuration Test")
print("=" * 60)

# Test MongoDB
print(f"\n[OK] MongoDB URI: {settings.MONGODB_URI[:30]}...")
print(f"[OK] MongoDB DB: {settings.MONGODB_DB}")

# Test API Keys (masked)
def mask_key(key: str) -> str:
    if not key:
        return "[MISSING] NOT SET"
    if len(key) < 8:
        return "[OK] SET (too short to mask)"
    return f"[OK] SET ({key[:4]}...{key[-4:]})"

print(f"\n--- External Data API Keys ---")
print(f"News API Key: {mask_key(settings.NEWS_API_KEY)}")
print(f"Vessel Tracking API Key: {mask_key(settings.VESSEL_TRACKING_API_KEY)}")

# Test PortWatch Endpoints
print(f"\n--- PortWatch Endpoints ---")
print(f"Daily Ports: {settings.PORTWATCH_DAILY_PORTS[:60]}...")
print(f"Chokepoints: {settings.PORTWATCH_CHOKEPOINTS[:60]}...")
print(f"Disruptions: {settings.PORTWATCH_DISRUPTIONS[:60]}...")
print(f"Ports DB: {settings.PORTWATCH_PORTS[:60]}...")

# Test ML Model Paths
print(f"\n--- ML Model Paths ---")
print(f"Model Dir: {settings.MODEL_DIR}")
print(f"XGB Model: {settings.XGB_MODEL_PATH}")
print(f"XGB Model Exists: {settings.XGB_MODEL_PATH.exists()}")

print("\n" + "=" * 60)
print("Configuration test complete!")
print("=" * 60)
