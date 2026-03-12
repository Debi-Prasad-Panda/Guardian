# server/test_full_backend.py
# Full backend audit — run with: python test_full_backend.py
# Tests every endpoint, WebSocket, and ML pipeline
# Run from: f:\Guardian\server\

import requests
import json
import asyncio
import websockets
import time
import sys

# Required for loading mapie_calibrated.pkl which was trained with this class
class XGBWrapper:
    pass

BASE = "http://localhost:8000"
RESULTS = []

def test(name, fn):
    try:
        result = fn()
        status = "PASS" if result["ok"] else "FAIL"
        RESULTS.append((status, name, result.get("detail", "")))
        symbol = "OK" if result["ok"] else "XX"
        print(f"  [{symbol}] {name}")
        if not result["ok"]:
            print(f"       --> {result.get('detail', 'unknown error')}")
        return result["ok"]
    except Exception as e:
        RESULTS.append(("FAIL", name, str(e)))
        print(f"  [XX] {name}")
        print(f"       --> {e}")
        return False


# ─────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("GUARDIAN BACKEND FULL AUDIT")
print("="*60)

# ── 1. HEALTH ─────────────────────────────────────────────────────
print("\n[1] HEALTH CHECKS")

test("API root reachable",
    lambda: {"ok": requests.get(f"{BASE}/api/health",
             timeout=5).status_code == 200})

test("MongoDB connected",
    lambda: {"ok": "connected" in requests.get(
             f"{BASE}/api/health", timeout=5).text.lower(),
             "detail": requests.get(f"{BASE}/api/health").text[:100]})

test("Tower 1 XGBoost health",
    lambda: {"ok": requests.get(f"{BASE}/api/ml/tower1/health",
             timeout=5).status_code == 200})

test("Tower 3 MLP health",
    lambda: {"ok": requests.get(f"{BASE}/api/ml/health",
             timeout=5).status_code == 200})

# ── 2. SHIPMENTS ──────────────────────────────────────────────────
print("\n[2] SHIPMENTS")

r_shipments = requests.get(f"{BASE}/api/shipments/", timeout=10).json()
shipment_ids = [s.get("shipment_id") or s.get("id") for s in r_shipments] if isinstance(r_shipments, list) else []
first_id = shipment_ids[0] if shipment_ids else "SHP_001"

test(f"GET /shipments/ returns list",
    lambda: {"ok": isinstance(r_shipments, list) and len(r_shipments) > 0,
             "detail": f"Got {len(r_shipments)} shipments"})

test(f"GET /shipments/{first_id}",
    lambda: {"ok": requests.get(f"{BASE}/api/shipments/{first_id}",
             timeout=5).status_code == 200})

test(f"GET /shipments/{first_id}/shap",
    lambda: {"ok": requests.get(f"{BASE}/api/shipments/{first_id}/shap",
             timeout=10).status_code == 200})

test(f"GET /shipments/{first_id}/dice",
    lambda: {"ok": requests.get(f"{BASE}/api/shipments/{first_id}/dice",
             timeout=15).status_code == 200})

test(f"GET /shipments/{first_id}/timeline",
    lambda: {"ok": requests.get(f"{BASE}/api/shipments/{first_id}/timeline",
             timeout=10).status_code == 200})

test(f"GET /shipments/{first_id}/kimi",
    lambda: {"ok": requests.get(f"{BASE}/api/shipments/{first_id}/kimi",
             timeout=20).status_code == 200})

test("GET /shipments/network",
    lambda: {"ok": requests.get(f"{BASE}/api/shipments/network",
             timeout=10).status_code == 200})

# ── 3. ML PIPELINE ────────────────────────────────────────────────
print("\n[3] ML PIPELINE")

def test_predict_shipment():
    r = requests.post(f"{BASE}/api/ml/predict-shipment",
        json={"shipment_id": first_id}, timeout=30)
    if r.status_code != 200:
        return {"ok": False, "detail": f"HTTP {r.status_code}: {r.text[:100]}"}
    data = r.json()
    has_risk        = "risk_score" in data
    has_uncertainty = "uncertainty" in data
    has_t1          = "t1_risk" in data
    return {
        "ok": has_risk and has_uncertainty,
        "detail": f"risk={data.get('risk_score')}, "
                  f"uncertainty={data.get('uncertainty')}, "
                  f"t1={data.get('t1_risk')}"
    }

test(f"POST /ml/predict-shipment ({first_id})", test_predict_shipment)

def test_ml_intervention():
    r = requests.post(f"{BASE}/api/ml/intervention",
        json={"shipment_id": first_id}, timeout=30)
    if r.status_code != 200:
        return {"ok": False, "detail": f"HTTP {r.status_code}"}
    data = r.json()
    return {
        "ok": "action" in data or "intervention" in data,
        "detail": str(data)[:120]
    }

test("POST /ml/intervention", test_ml_intervention)

# ── 4. CHAOS & RIPPLE ─────────────────────────────────────────────
print("\n[4] CHAOS & RIPPLE")

test("GET /chaos/presets",
    lambda: {"ok": requests.get(f"{BASE}/api/chaos/presets",
             timeout=5).status_code == 200})

def test_chaos_inject():
    r = requests.post(f"{BASE}/api/chaos/inject",
        json={"weather_severity": 7.0,
              "port_strike": 0.6,
              "affected_hub": "Mumbai"},
        timeout=20)
    return {"ok": r.status_code == 200,
            "detail": f"HTTP {r.status_code}"}

test("POST /chaos/inject", test_chaos_inject)

def test_ripple():
    r = requests.post(
        f"{BASE}/api/chaos/ripple/{first_id}?base_risk=0.78",
        timeout=10)
    if r.status_code != 200:
        return {"ok": False, "detail": f"HTTP {r.status_code}: {r.text[:100]}"}
    data = r.json()
    return {
        "ok": "affected" in data,
        "detail": f"affected={data.get('total_count', 0)} shipments"
    }

test(f"POST /chaos/ripple/{first_id}", test_ripple)

def test_batch_disruption():
    r = requests.post(
        f"{BASE}/api/chaos/batch-disruption?hub=Mumbai&severity=8.0",
        timeout=15)
    if r.status_code != 200:
        return {"ok": False, "detail": f"HTTP {r.status_code}: {r.text[:100]}"}
    data = r.json()
    return {
        "ok": "affected" in data,
        "detail": f"hub={data.get('hub')}, "
                  f"affected={data.get('total_count', 0)}"
    }

test("POST /chaos/batch-disruption (Mumbai, severity=8)", test_batch_disruption)

test("GET /chaos/graph/summary",
    lambda: {
        "ok": requests.get(f"{BASE}/api/chaos/graph/summary",
              timeout=5).status_code == 200,
        "detail": requests.get(f"{BASE}/api/chaos/graph/summary").text[:100]
    })

# ── 5. PORTS ──────────────────────────────────────────────────────
print("\n[5] PORTS")

test("GET /ports/",
    lambda: {"ok": requests.get(f"{BASE}/api/ports/",
             timeout=5).status_code == 200})

test("GET /ports/kpis",
    lambda: {"ok": requests.get(f"{BASE}/api/ports/kpis",
             timeout=5).status_code == 200})

test("GET /ports/vessels",
    lambda: {"ok": requests.get(f"{BASE}/api/ports/vessels",
             timeout=5).status_code == 200})

# ── 6. DASHBOARD & ANALYTICS ──────────────────────────────────────
print("\n[6] DASHBOARD & ANALYTICS")

test("GET /dashboard/overview",
    lambda: {"ok": requests.get(f"{BASE}/api/dashboard/overview",
             timeout=5).status_code == 200})

test("GET /analytics/summary",
    lambda: {"ok": requests.get(f"{BASE}/api/analytics/summary",
             timeout=5).status_code == 200})

test("GET /analytics/graph-summary",
    lambda: {"ok": requests.get(f"{BASE}/api/analytics/graph-summary",
             timeout=5).status_code == 200})

# ── 7. EXTERNAL DATA ──────────────────────────────────────────────
print("\n[7] EXTERNAL DATA (may be slower)")

def test_external(path, timeout=15):
    try:
        r = requests.get(f"{BASE}/api/external/{path}", timeout=timeout)
        return {"ok": r.status_code == 200,
                "detail": f"HTTP {r.status_code}"}
    except requests.Timeout:
        return {"ok": False, "detail": "Timeout — external API slow"}

test("GET /external/weather",
    lambda: test_external("weather", timeout=20))

test("GET /external/live-context",
    lambda: test_external("live-context", timeout=25))

test("GET /external/ports/congestion",
    lambda: test_external("ports/congestion", timeout=20))

test("GET /external/ports/disruptions",
    lambda: test_external("ports/disruptions", timeout=20))

test("GET /external/chokepoints",
    lambda: test_external("chokepoints", timeout=20))

test("GET /external/news",
    lambda: test_external("news", timeout=20))

# ── 8. SETTINGS ───────────────────────────────────────────────────
print("\n[8] SETTINGS")

test("GET /settings/",
    lambda: {"ok": requests.get(f"{BASE}/api/settings/",
             timeout=5).status_code == 200})

# ── 9. WEBSOCKET ──────────────────────────────────────────────────
print("\n[9] WEBSOCKET")

async def test_websocket():
    try:
        uri = "ws://localhost:8000/ws/risk-updates"
        async with websockets.connect(uri, open_timeout=5) as ws:
            # Wait for first message (backend sends every 4s)
            msg = await asyncio.wait_for(ws.recv(), timeout=8.0)
            data = json.loads(msg)
            return {
                "ok": True,
                "detail": f"Received: {str(data)[:80]}"
            }
    except asyncio.TimeoutError:
        return {"ok": False, "detail": "No message within 8s"}
    except Exception as e:
        return {"ok": False, "detail": str(e)}

ws_result = asyncio.run(test_websocket())
status = "PASS" if ws_result["ok"] else "FAIL"
symbol = "OK" if ws_result["ok"] else "XX"
RESULTS.append((status, "WebSocket /ws/risk-updates", ws_result["detail"]))
print(f"  [{symbol}] WebSocket /ws/risk-updates")
if not ws_result["ok"]:
    print(f"       --> {ws_result['detail']}")

# ── MAPIE ─────────────────────────────────────────────────────────
print("\n[10] MAPIE CONFORMAL PREDICTION")

def test_mapie():
    import pickle, os
    path = os.path.join(os.path.dirname(__file__),
                        "models", "mapie_calibrated.pkl")
    if not os.path.exists(path):
        return {"ok": False, "detail": "mapie_calibrated.pkl not found"}
    with open(path, "rb") as f:
        obj = pickle.load(f)
    has_calibrated = "mapie"         in obj
    has_features   = "feature_cols"  in obj
    return {
        "ok": has_calibrated and has_features,
        "detail": f"version={obj.get('version', 'unknown')}, "
                  f"confidence={obj.get('confidence', '?')}"
    }

test("mapie_calibrated.pkl valid", test_mapie)

# ── FINAL REPORT ──────────────────────────────────────────────────
print("\n" + "="*60)
print("AUDIT RESULTS")
print("="*60)

passed = [r for r in RESULTS if r[0] == "PASS"]
failed = [r for r in RESULTS if r[0] == "FAIL"]

print(f"\n  PASSED: {len(passed)}/{len(RESULTS)}")
print(f"  FAILED: {len(failed)}/{len(RESULTS)}")

if failed:
    print("\nFAILED TESTS:")
    for _, name, detail in failed:
        print(f"  - {name}")
        if detail:
            print(f"    {detail}")

score_pct = len(passed) / len(RESULTS) * 100
print(f"\nBackend Health Score: {score_pct:.0f}%")

if score_pct == 100:
    print("All systems GO — ready for Docker")
elif score_pct >= 80:
    print("Minor issues — fix failed tests then Docker")
else:
    print("Critical failures — fix before proceeding")

print("="*60 + "\n")

sys.exit(0 if len(failed) == 0 else 1)
