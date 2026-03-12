# server/app/routers/external_data.py
"""
Guardian — External Data Router
Exposes real-time data from PortWatch, weather, and news APIs.
"""
from fastapi import APIRouter
from app.services.external_data_service import (
    get_live_context,
    get_portwatch_daily_ports,
    get_portwatch_disruptions,
    get_portwatch_chokepoints,
    get_weather_for_ports,
    get_logistics_news
)

router = APIRouter(prefix="/api/external", tags=["external-data"])


@router.get("/live-context")
async def live_context():
    """
    Combined real-data context for Chaos Injector + Network Ripple.
    
    Fetches:
    - PortWatch port congestion (satellite-derived vessel counts)
    - Open-Meteo weather data for all port cities
    - PortWatch disruptions (GDACS natural disasters)
    - PortWatch chokepoints (Suez, Hormuz, Malacca transit data)
    - NewsAPI logistics headlines
    
    Returns unified context object with all data merged.
    """
    return await get_live_context()


@router.get("/ports/congestion")
async def ports_congestion():
    """
    Real-time port congestion data from PortWatch.
    Returns vessel counts and congestion index (0-10) per port.
    """
    return await get_portwatch_daily_ports()


@router.get("/ports/disruptions")
async def ports_disruptions():
    """
    Active disruptions affecting ports (GDACS natural disasters + geopolitical events).
    """
    return await get_portwatch_disruptions()


@router.get("/chokepoints")
async def chokepoints():
    """
    Chokepoint status (Suez Canal, Strait of Hormuz, Malacca Strait).
    Returns transit call data vs baseline.
    """
    return await get_portwatch_chokepoints()


@router.get("/weather")
async def weather():
    """
    Current weather conditions for all port cities.
    Returns temperature, precipitation, wind speed, and severity index.
    """
    return await get_weather_for_ports()


@router.get("/news")
async def news(top_n: int = 5):
    """
    Recent logistics and supply chain news headlines.
    Returns top N articles with sentiment analysis.
    """
    return await get_logistics_news(top_n=top_n)
