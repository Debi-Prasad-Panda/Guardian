"""
Test script for external data service.
Run: python test_external_data.py
"""
import asyncio
import sys
import io
from app.services.external_data_service import (
    get_portwatch_daily_ports,
    get_portwatch_disruptions,
    get_portwatch_chokepoints,
    get_weather_for_ports,
    get_logistics_news,
    get_live_context
)

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


async def test_all():
    print("=" * 70)
    print("Guardian External Data Service Test")
    print("=" * 70)
    
    # Test 1: PortWatch Daily Ports
    print("\n[TEST 1] PortWatch Daily Ports...")
    try:
        ports = await get_portwatch_daily_ports()
        print(f"  [OK] Fetched data for {len(ports)} ports")
        for port_name, data in list(ports.items())[:2]:
            print(f"    - {port_name}: Congestion={data.get('congestion_index')}, Source={data.get('source')}")
    except Exception as e:
        print(f"  [ERROR] {e}")
    
    # Test 2: PortWatch Disruptions
    print("\n[TEST 2] PortWatch Disruptions...")
    try:
        disruptions = await get_portwatch_disruptions()
        print(f"  [OK] Fetched {len(disruptions)} disruptions")
        for d in disruptions[:2]:
            print(f"    - {d.get('port')}: {d.get('type')} (Severity: {d.get('severity')})")
    except Exception as e:
        print(f"  [ERROR] {e}")
    
    # Test 3: PortWatch Chokepoints
    print("\n[TEST 3] PortWatch Chokepoints...")
    try:
        chokepoints = await get_portwatch_chokepoints()
        print(f"  [OK] Fetched {len(chokepoints)} chokepoints")
        for name, data in chokepoints.items():
            print(f"    - {name}: Status={data.get('status')}, Source={data.get('source')}")
    except Exception as e:
        print(f"  [ERROR] {e}")
    
    # Test 4: Weather Data
    print("\n[TEST 4] Open-Meteo Weather...")
    try:
        weather = await get_weather_for_ports()
        print(f"  [OK] Fetched weather for {len(weather)} ports")
        for port_name, data in list(weather.items())[:2]:
            temp = data.get('temperature_c', 'N/A')
            severity = data.get('weather_severity_index', 'N/A')
            print(f"    - {port_name}: Temp={temp}°C, Severity={severity}, Source={data.get('source')}")
    except Exception as e:
        print(f"  [ERROR] {e}")
    
    # Test 5: News API
    print("\n[TEST 5] NewsAPI Logistics Headlines...")
    try:
        news = await get_logistics_news(top_n=3)
        print(f"  [OK] Fetched {len(news)} news articles")
        for article in news[:2]:
            print(f"    - {article.get('title')[:60]}...")
            print(f"      Source: {article.get('source')}, Sentiment: {article.get('sentiment_score')}")
    except Exception as e:
        print(f"  [ERROR] {e}")
    
    # Test 6: Combined Live Context
    print("\n[TEST 6] Combined Live Context...")
    try:
        context = await get_live_context()
        print(f"  [OK] Live context assembled")
        print(f"    - Ports: {len(context.get('ports', {}))} entries")
        print(f"    - Disruptions: {len(context.get('disruptions', []))} entries")
        print(f"    - Chokepoints: {len(context.get('chokepoints', {}))} entries")
        print(f"    - News: {len(context.get('news', []))} articles")
        print(f"    - Timestamp: {context.get('timestamp')}")
    except Exception as e:
        print(f"  [ERROR] {e}")
    
    print("\n" + "=" * 70)
    print("External Data Service Test Complete!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_all())
