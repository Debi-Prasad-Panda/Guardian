"""
Comprehensive API Endpoint Test
Tests all routers and their endpoints to ensure they're properly registered.
Run: python test_all_endpoints.py
"""
import asyncio
import sys
import io
import httpx

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8000"

# Define all endpoints to test
ENDPOINTS = {
    "Analytics Router": [
        ("GET", "/api/analytics/summary"),
        ("GET", "/api/dashboard/overview"),
        ("GET", "/api/analytics/graph-summary"),
    ],
    "Chaos Router": [
        ("GET", "/api/chaos/presets"),
        ("POST", "/api/chaos/inject", {"weather_severity": 5, "port_strike": 5, "affected_hub": "Mumbai JNPT"}),
        ("GET", "/api/chaos/graph/summary"),
    ],
    "External Data Router": [
        ("GET", "/api/external/live-context"),
        ("GET", "/api/external/ports/congestion"),
        ("GET", "/api/external/ports/disruptions"),
        ("GET", "/api/external/chokepoints"),
        ("GET", "/api/external/weather"),
        ("GET", "/api/external/news"),
    ],
    "ML Router": [
        ("GET", "/api/ml/health"),
        ("GET", "/api/ml/tower1/health"),
    ],
    "Ports Router": [
        ("GET", "/api/ports/"),
        ("GET", "/api/ports/vessels"),
        ("GET", "/api/ports/kpis"),
    ],
    "Settings Router": [
        ("GET", "/api/settings/"),
    ],
    "Shipments Router": [
        ("GET", "/api/shipments/"),
        ("GET", "/api/shipments/network"),
    ],
    "Health Check": [
        ("GET", "/api/health"),
        ("GET", "/"),
    ],
}


async def test_endpoint(client: httpx.AsyncClient, method: str, path: str, json_data=None):
    """Test a single endpoint and return status."""
    try:
        if method == "GET":
            response = await client.get(f"{BASE_URL}{path}", timeout=10.0)
        elif method == "POST":
            response = await client.post(f"{BASE_URL}{path}", json=json_data, timeout=10.0)
        else:
            return "SKIP", "Unsupported method"
        
        if response.status_code == 200:
            return "OK", response.status_code
        elif response.status_code == 404:
            return "NOT_FOUND", response.status_code
        else:
            return "ERROR", response.status_code
    except httpx.ConnectError:
        return "NO_SERVER", "Server not running"
    except httpx.TimeoutException:
        return "TIMEOUT", "Request timed out"
    except Exception as e:
        return "ERROR", str(e)[:50]


async def test_all():
    print("=" * 80)
    print("Guardian API Endpoint Test")
    print("=" * 80)
    print(f"\nTesting against: {BASE_URL}")
    print("Make sure the server is running: cd server && uvicorn app.main:app --reload\n")
    
    async with httpx.AsyncClient() as client:
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        not_found = 0
        
        for router_name, endpoints in ENDPOINTS.items():
            print(f"\n{'─' * 80}")
            print(f"Testing: {router_name}")
            print('─' * 80)
            
            for endpoint_info in endpoints:
                method = endpoint_info[0]
                path = endpoint_info[1]
                json_data = endpoint_info[2] if len(endpoint_info) > 2 else None
                
                total_tests += 1
                status, detail = await test_endpoint(client, method, path, json_data)
                
                # Format output
                status_symbol = {
                    "OK": "[✓]",
                    "NOT_FOUND": "[✗]",
                    "ERROR": "[!]",
                    "NO_SERVER": "[X]",
                    "TIMEOUT": "[T]",
                    "SKIP": "[-]"
                }.get(status, "[?]")
                
                status_color = {
                    "OK": "PASS",
                    "NOT_FOUND": "404",
                    "ERROR": "FAIL",
                    "NO_SERVER": "NO_SERVER",
                    "TIMEOUT": "TIMEOUT",
                    "SKIP": "SKIP"
                }.get(status, "UNKNOWN")
                
                print(f"  {status_symbol} {method:4} {path:50} {status_color:10} {detail}")
                
                if status == "OK":
                    passed_tests += 1
                elif status == "NOT_FOUND":
                    not_found += 1
                    failed_tests += 1
                elif status == "NO_SERVER":
                    print("\n" + "=" * 80)
                    print("ERROR: Server is not running!")
                    print("Please start the server with: cd server && uvicorn app.main:app --reload")
                    print("=" * 80)
                    return
                else:
                    failed_tests += 1
    
    # Summary
    print("\n" + "=" * 80)
    print("Test Summary")
    print("=" * 80)
    print(f"Total Tests:    {total_tests}")
    print(f"Passed:         {passed_tests} ({passed_tests/total_tests*100:.1f}%)")
    print(f"Failed:         {failed_tests} ({failed_tests/total_tests*100:.1f}%)")
    print(f"  - Not Found:  {not_found}")
    print(f"  - Errors:     {failed_tests - not_found}")
    print("=" * 80)
    
    if passed_tests == total_tests:
        print("\n✓ All endpoints are working correctly!")
    elif not_found > 0:
        print(f"\n⚠ {not_found} endpoints returned 404 - check router registration in main.py")
    else:
        print(f"\n✗ {failed_tests} endpoints failed - check server logs for details")


if __name__ == "__main__":
    asyncio.run(test_all())
