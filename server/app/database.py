"""
Guardian Backend — MongoDB Connection
Uses motor (async pymongo) for non-blocking database access.
"""
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Called on FastAPI startup."""
    global client, db
    
    # Adding tls parameters for Python 3.13 + MongoDB Atlas compatibility
    client = AsyncIOMotorClient(
        settings.MONGODB_URI, 
        tlsCAFile=certifi.where(),
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=5000
    )
    db = client[settings.MONGODB_DB]
    # Quick connectivity check
    try:
        await client.admin.command("ping")
        print(f"OK: Connected to MongoDB: {settings.MONGODB_URI}/{settings.MONGODB_DB}")
    except Exception as e:
        print(f"WARN: MongoDB connection failed: {e}")
        print("   Backend will still start — endpoints using DB will return errors.")


async def close_db():
    """Called on FastAPI shutdown."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_db():
    """Returns the database instance. Use in routers/services."""
    return db
