import sys, traceback, asyncio
sys.path.insert(0, '.')

print('=== EXTERNAL DATA SERVICE ===')
try:
    from app.services.external_data_service import (
        get_weather_for_ports,
        get_portwatch_congestion,
        get_logistics_news_gdelt
    )
    print('external_data_service imports OK')

    async def test():
        print('Testing weather...')
        result = await get_weather_for_ports()
        print('Weather keys: %s' % list(result.keys())[:3])

    asyncio.run(test())
except:
    traceback.print_exc()
