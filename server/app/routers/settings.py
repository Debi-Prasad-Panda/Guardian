"""
Guardian — Settings Router
Persist and retrieve user settings from MongoDB.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    risk_threshold: Optional[float] = None
    kimi_api_key: Optional[str] = None
    mapbox_token: Optional[str] = None
    backend_url: Optional[str] = None
    gemini_api_key: Optional[str] = None
    model_confidence_threshold: Optional[float] = None
    notifications: Optional[Dict[str, Any]] = None


@router.get("/")
async def get_settings():
    """Return current user settings."""
    db = get_db()
    settings = await db.settings.find_one({"type": "user_settings"}, {"_id": 0})
    if not settings:
        return {
            "type": "user_settings",
            "risk_threshold": 0.65,
            "kimi_api_key": "",
            "mapbox_token": "",
            "backend_url": "http://localhost:8000",
            "gemini_api_key": "",
            "model_confidence_threshold": 0.5,
            "notifications": {
                "email_alerts": True,
                "risk_threshold_alerts": True,
                "intervention_alerts": True,
                "weekly_digest": False
            }
        }
    return settings


@router.put("/")
async def update_settings(payload: SettingsUpdate):
    """Update user settings in MongoDB."""
    db = get_db()
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if update_data:
        await db.settings.update_one(
            {"type": "user_settings"},
            {"$set": update_data},
            upsert=True
        )
    return {"message": "Settings updated", "updated_fields": list(update_data.keys())}
