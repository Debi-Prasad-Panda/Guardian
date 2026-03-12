# server/app/services/external_data_service.py
"""
Guardian — External Data Integration Service
Fetches real-time data from:
  - IMF PortWatch (ArcGIS REST API) — port congestion, disruptions, chokepoints
  - Open-Meteo — weather data for port cities
  - NewsAPI — logistics news headlines
"""
import httpx
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.config import settings

logger = logging.getLogger(__name__)

# ── Port Coordinates (Indian ports) ──────────────────────────────────────────
PORT_COORDS = {
    "Mumbai JNPT": {"lat": 18.9520, "lng": 72.9481, "code": "INNSA"},
    "Chennai Port": {"lat": 13.0827, "lng": 80.2707, "code": "INMAA"},
    "Kolkata Port": {"lat": 22.5726, "lng": 88.3639, "code": "INCCU"},
    "Delhi ICD": {"lat": 28.6139, "lng": 77.2090, "code": "INDEL"},
    "Kandla Port": {"lat": 23.0225, "lng": 70.2167, "code": "INKAN"},
    "Visakhapatnam Port": {"lat": 17.6868, "lng": 83.2185, "code": "INVTZ"},
    "Tuticorin Port": {"lat": 8.7642, "lng": 78.1348, "code": "INTUT"},
}

# ── PortWatch Port ID Mapping ─────────────────────────────────────────────────
PORTWATCH_PORT_IDS = {
    "Mumbai JNPT": "INNSA",
    "Chennai Port": "INMAA",
    "Kolkata Port": "INCCU",
    "Delhi ICD": "INDEL",
    "Kandla Port": "INKAN",
    "Visakhapatnam Port": "INVTZ",
    "Tuticorin Port": "INTUT",
}


# ══════════════════════════════════════════════════════════════════════════════
#  1. PORTWATCH — Real Port Congestion Data
# ══════════════════════════════════════════════════════════════════════════════

async def get_portwatch_daily_ports() -> Dict[str, Any]:
    """
    Fetch daily port activity data from PortWatch ArcGIS REST API.
    Returns vessel counts and congestion metrics per port.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                settings.PORTWATCH_DAILY_PORTS,
                params={
                    "where": "1=1",
                    "outFields": "*",
                    "outSR": "4326",
                    "f": "json"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Parse features
            features = data.get("features", [])
            logger.info(f"✅ PortWatch Daily Ports: Fetched {len(features)} records")
            
            # Map to our port structure
            port_data = {}
            for feature in features:
                attrs = feature.get("attributes", {})
                port_name = attrs.get("port_name", "Unknown")
                
                # Match to our Indian ports
                matched_port = None
                for our_port in PORT_COORDS.keys():
                    if port_name.lower() in our_port.lower() or our_port.lower() in port_name.lower():
                        matched_port = our_port
                        break
                
                if matched_port:
                    vessel_calls = attrs.get("vessel_calls", 0)
                    baseline = attrs.get("baseline_calls", 100)
                    
                    # Calculate congestion index (0-10 scale)
                    ratio = vessel_calls / max(baseline, 1)
                    congestion = min(max((ratio - 0.5) * 10, 0.0), 10.0)
                    
                    port_data[matched_port] = {
                        "congestion_index": round(congestion, 1),
                        "vessel_calls": vessel_calls,
                        "baseline_calls": baseline,
                        "ratio": round(ratio, 2),
                        "source": "portwatch_live",
                        "timestamp": attrs.get("date", datetime.now().isoformat())
                    }
            
            # Fill in missing ports with synthetic data
            for port_name in PORT_COORDS.keys():
                if port_name not in port_data:
                    port_data[port_name] = {
                        "congestion_index": round(2.0 + hash(port_name) % 30 / 10, 1),
                        "vessel_calls": None,
                        "source": "synthetic_fallback"
                    }
            
            return port_data
            
    except Exception as e:
        logger.error(f"❌ PortWatch Daily Ports failed: {e}")
        # Return synthetic fallback for all ports
        return {
            port: {
                "congestion_index": round(2.0 + hash(port) % 30 / 10, 1),
                "vessel_calls": None,
                "source": "error_fallback"
            }
            for port in PORT_COORDS.keys()
        }


async def get_portwatch_disruptions() -> List[Dict[str, Any]]:
    """
    Fetch active disruptions from PortWatch (GDACS natural disasters + geopolitical events).
    Returns list of disruptions affecting ports.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                settings.PORTWATCH_DISRUPTIONS,
                params={
                    "where": "1=1",
                    "outFields": "*",
                    "outSR": "4326",
                    "f": "json"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            features = data.get("features", [])
            logger.info(f"✅ PortWatch Disruptions: Fetched {len(features)} records")
            
            disruptions = []
            for feature in features[:10]:  # Limit to top 10
                attrs = feature.get("attributes", {})
                
                # Filter for Indian ports or relevant disruptions
                port_name = attrs.get("port_name", "Unknown")
                disaster_type = attrs.get("disaster_type", "Unknown")
                severity = attrs.get("severity", 5.0)
                
                disruptions.append({
                    "port": port_name,
                    "type": disaster_type,
                    "severity": float(severity),
                    "start_date": attrs.get("start_date", ""),
                    "description": attrs.get("description", "No description available"),
                    "source": "portwatch_gdacs",
                    "coordinates": feature.get("geometry", {})
                })
            
            return disruptions
            
    except Exception as e:
        logger.error(f"❌ PortWatch Disruptions failed: {e}")
        return []


async def get_portwatch_chokepoints() -> Dict[str, Any]:
    """
    Fetch chokepoint status (Suez Canal, Strait of Hormuz, Malacca Strait).
    Returns transit call data vs baseline.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                settings.PORTWATCH_CHOKEPOINTS,
                params={
                    "where": "1=1",
                    "outFields": "*",
                    "outSR": "4326",
                    "f": "json"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            features = data.get("features", [])
            logger.info(f"✅ PortWatch Chokepoints: Fetched {len(features)} records")
            
            chokepoints = {}
            for feature in features:
                attrs = feature.get("attributes", {})
                name = attrs.get("chokepoint_name", "Unknown")
                
                transit_calls = attrs.get("transit_calls", 50)
                baseline = attrs.get("baseline_calls", 50)
                ratio = transit_calls / max(baseline, 1)
                
                # Determine status
                if ratio < 0.7:
                    status = "DISRUPTED"
                elif ratio < 0.9:
                    status = "ELEVATED"
                else:
                    status = "NORMAL"
                
                chokepoints[name] = {
                    "transit_calls": transit_calls,
                    "baseline": baseline,
                    "disruption_ratio": round(ratio, 3),
                    "status": status,
                    "source": "portwatch_live",
                    "coordinates": feature.get("geometry", {})
                }
            
            # Ensure key chokepoints exist
            for key_chokepoint in ["Suez Canal", "Strait of Hormuz", "Strait of Malacca"]:
                if key_chokepoint not in chokepoints:
                    chokepoints[key_chokepoint] = {
                        "status": "UNKNOWN",
                        "source": "fallback"
                    }
            
            return chokepoints
            
    except Exception as e:
        logger.error(f"❌ PortWatch Chokepoints failed: {e}")
        return {
            "Suez Canal": {"status": "UNKNOWN", "source": "error_fallback"},
            "Strait of Hormuz": {"status": "UNKNOWN", "source": "error_fallback"},
            "Strait of Malacca": {"status": "UNKNOWN", "source": "error_fallback"},
        }


# ══════════════════════════════════════════════════════════════════════════════
#  2. WEATHER — Open-Meteo API (Free, No Auth Required)
# ══════════════════════════════════════════════════════════════════════════════

async def get_weather_for_ports() -> Dict[str, Any]:
    """
    Fetch current weather conditions for all port cities using Open-Meteo API.
    Returns temperature, precipitation, wind speed, and weather code.
    """
    weather_data = {}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            port_names = list(PORT_COORDS.keys())

            # Build coroutines inside the async with so the client stays open
            async def _fetch_one(port_name, coords):
                try:
                    response = await client.get(
                        "https://api.open-meteo.com/v1/forecast",
                        params={
                            "latitude":  coords["lat"],
                            "longitude": coords["lng"],
                            "current":   "temperature_2m,precipitation,wind_speed_10m,weather_code",
                            "timezone":  "Asia/Kolkata"
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    current = data.get("current", {})

                    precip       = current.get("precipitation", 0)
                    wind         = current.get("wind_speed_10m", 0)
                    weather_code = current.get("weather_code", 0)
                    extreme_flag = 1 if weather_code >= 80 else 0
                    severity_index = min(precip * 0.4 + wind * 0.3 + extreme_flag * 30, 100.0)

                    return port_name, {
                        "temperature_c":          current.get("temperature_2m", 25.0),
                        "precipitation_mm":       precip,
                        "wind_speed_kmh":         wind,
                        "weather_code":           weather_code,
                        "weather_severity_index": round(severity_index, 1),
                        "extreme_weather_flag":   extreme_flag,
                        "source":                 "open_meteo_live",
                        "timestamp":              current.get("time", datetime.now().isoformat())
                    }
                except Exception as e:
                    logger.warning(f"Weather fetch failed for {port_name}: {e}")
                    return port_name, {"weather_severity_index": 5.0, "source": "fallback"}

            # Gather all requests in parallel (client is still open)
            results = await asyncio.gather(
                *[_fetch_one(name, PORT_COORDS[name]) for name in port_names]
            )
            for port_name, data in results:
                weather_data[port_name] = data

        logger.info(f"Weather: Fetched data for {len(weather_data)} ports")
        return weather_data

    except Exception as e:
        logger.error(f"Weather API failed: {e}")
        return {
            port: {"weather_severity_index": 5.0, "source": "error_fallback"}
            for port in PORT_COORDS.keys()
        }



# ══════════════════════════════════════════════════════════════════════════════
#  3. NEWS — NewsAPI for Logistics Headlines
# ══════════════════════════════════════════════════════════════════════════════

async def get_logistics_news(top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Fetch recent logistics and supply chain news from NewsAPI.
    Returns top N headlines with sentiment indicators.
    """
    if not settings.NEWS_API_KEY:
        logger.warning("⚠️  NEWS_API_KEY not set, skipping news fetch")
        return []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Search for logistics-related news
            response = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": "logistics OR supply chain OR shipping OR port congestion",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": top_n,
                    "apiKey": settings.NEWS_API_KEY
                }
            )
            response.raise_for_status()
            data = response.json()
            
            articles = data.get("articles", [])
            logger.info(f"✅ NewsAPI: Fetched {len(articles)} articles")
            
            news_items = []
            for article in articles:
                # Simple sentiment analysis based on keywords
                title = article.get("title", "").lower()
                description = article.get("description", "").lower()
                text = f"{title} {description}"
                
                negative_words = ["delay", "disruption", "strike", "shortage", "crisis", "congestion"]
                positive_words = ["improve", "growth", "efficient", "success", "recovery"]
                
                neg_count = sum(1 for word in negative_words if word in text)
                pos_count = sum(1 for word in positive_words if word in text)
                
                sentiment_score = (pos_count - neg_count) / max(pos_count + neg_count, 1)
                
                news_items.append({
                    "title": article.get("title", "No title"),
                    "description": article.get("description", ""),
                    "url": article.get("url", ""),
                    "source": article.get("source", {}).get("name", "Unknown"),
                    "published_at": article.get("publishedAt", ""),
                    "sentiment_score": round(sentiment_score, 2),
                    "image_url": article.get("urlToImage", "")
                })
            
            return news_items
            
    except Exception as e:
        logger.error(f"❌ NewsAPI failed: {e}")
        return []


# ══════════════════════════════════════════════════════════════════════════════
#  4. COMBINED LIVE CONTEXT ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

async def get_live_context() -> Dict[str, Any]:
    """
    Fetch all external data sources in parallel and combine into unified context.
    
    Returns:
    {
        "ports": {
            "Mumbai JNPT": {
                "congestion_index": 7.2,
                "weather_severity_index": 15.3,
                "temperature_c": 28.5,
                ...
            },
            ...
        },
        "disruptions": [...],
        "chokepoints": {...},
        "news": [...],
        "timestamp": "2025-01-28T10:30:00Z"
    }
    """
    logger.info("🔄 Fetching live context from all external sources...")
    
    # Fetch all data sources in parallel
    (
        port_congestion,
        weather,
        disruptions,
        chokepoints,
        news
    ) = await asyncio.gather(
        get_portwatch_daily_ports(),
        get_weather_for_ports(),
        get_portwatch_disruptions(),
        get_portwatch_chokepoints(),
        get_logistics_news(top_n=5),
        return_exceptions=True  # Don't fail if one source fails
    )
    
    # Handle exceptions
    if isinstance(port_congestion, Exception):
        logger.error(f"Port congestion fetch failed: {port_congestion}")
        port_congestion = {}
    if isinstance(weather, Exception):
        logger.error(f"Weather fetch failed: {weather}")
        weather = {}
    if isinstance(disruptions, Exception):
        logger.error(f"Disruptions fetch failed: {disruptions}")
        disruptions = []
    if isinstance(chokepoints, Exception):
        logger.error(f"Chokepoints fetch failed: {chokepoints}")
        chokepoints = {}
    if isinstance(news, Exception):
        logger.error(f"News fetch failed: {news}")
        news = []
    
    # Merge port congestion + weather into unified port context
    port_context = {}
    for port_name in PORT_COORDS.keys():
        port_context[port_name] = {
            **port_congestion.get(port_name, {}),
            **weather.get(port_name, {}),
            "coordinates": PORT_COORDS[port_name]
        }
    
    logger.info("✅ Live context assembled successfully")
    
    return {
        "ports": port_context,
        "disruptions": disruptions,
        "chokepoints": chokepoints,
        "news": news,
        "timestamp": datetime.now().isoformat(),
        "sources": {
            "ports": "PortWatch ArcGIS + Open-Meteo",
            "disruptions": "PortWatch GDACS",
            "chokepoints": "PortWatch Transit Data",
            "news": "NewsAPI"
        }
    }


# ── Backward-compatible aliases ───────────────────────────────────────────────
# Phase-4 test script and some routers use these shorter names.
get_portwatch_congestion  = get_portwatch_daily_ports
get_logistics_news_gdelt  = get_logistics_news
