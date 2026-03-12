import requests

BASE_URL = "http://localhost:8000"

endpoints = [
    ("/api/health", "Health Check"),
    ("/api/shipments", "All Shipments"),
    ("/api/ports", "All Ports"),
    ("/api/analytics/summary", "Analytics Summary"),
    ("/api/chaos/presets", "Chaos Presets")
]

print("Testing Guardian APIs...")
for ep, name in endpoints:
    url = f"{BASE_URL}{ep}"
    try:
        res = requests.get(url)
        print(f"[{res.status_code}] {name} ({ep})")
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list):
                print(f"  -> Returned List of {len(data)} items")
            elif isinstance(data, dict):
                print(f"  -> Returned Object with keys: {list(data.keys())[:5]}")
        else:
            print(f"  -> ERROR: {res.text}")
    except Exception as e:
        print(f"  -> ERROR testing {name}: {e}")
