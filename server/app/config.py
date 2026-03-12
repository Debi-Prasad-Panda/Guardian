"""
Guardian Backend — Configuration
Loads environment variables from .env and exposes typed settings.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from server root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "guardian")
    PORT: int = int(os.getenv("PORT", "8000"))

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    KIMI_API_KEY: str = os.getenv("KIMI_API_KEY", "")
    MAPBOX_TOKEN: str = os.getenv("MAPBOX_TOKEN", "")

    # External Data API Keys
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    VESSEL_TRACKING_API_KEY: str = os.getenv("VESSEL_TRACKING_API_KEY", "")

    # PortWatch ArcGIS REST API Endpoints
    PORTWATCH_DAILY_PORTS: str = os.getenv(
        "PORTWATCH_DAILY_PORTS",
        "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Ports_Data/FeatureServer/0/query"
    )
    PORTWATCH_CHOKEPOINTS: str = os.getenv(
        "PORTWATCH_CHOKEPOINTS",
        "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/PortWatch_chokepoints_database/FeatureServer/0/query"
    )
    PORTWATCH_DISRUPTIONS: str = os.getenv(
        "PORTWATCH_DISRUPTIONS",
        "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/portwatch_disruptions_database/FeatureServer/0/query"
    )
    PORTWATCH_PORTS: str = os.getenv(
        "PORTWATCH_PORTS",
        "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/PortWatch_ports_database/FeatureServer/0/query"
    )

    # ML Model paths
    MODEL_DIR: Path = Path(__file__).resolve().parent.parent.parent / "model"
    XGB_MODEL_PATH: Path = MODEL_DIR / "v4" / "xgb_tower1_model.json"


settings = Settings()
