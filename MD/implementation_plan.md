# Phase 1 — Fix All 11 Failing Routes

All 7 Phase-1 curl calls return `{"detail":"Not Found"}`. Root-cause analysis complete.

---

## Root Causes

| Failure | Root Cause |
|---|---|
| `GET /shipments/SHP_001/dice` | [dice_service.py](file:///F:/Guardian/server/app/services/dice_service.py) has [generate_counterfactuals()](file:///F:/Guardian/server/app/services/dice_service.py#125-254) but router calls non-existent `generate_dice_for_shipment()` |
| `GET /shipments/SHP_001/kimi` | [kimi_service.py](file:///F:/Guardian/server/app/services/kimi_service.py) has [get_intervention_recommendation()](file:///F:/Guardian/server/app/services/kimi_service.py#117-180) but router calls non-existent `generate_kimi_for_shipment()` |
| `POST /chaos/ripple/SHP_001` | Route simply **does not exist** in [chaos.py](file:///F:/Guardian/server/app/routers/chaos.py) |
| `POST /chaos/batch-disruption` | Route exists but as **GET**, test expects **POST** |
| `GET /chaos/graph/summary` | Route simply **does not exist** in [chaos.py](file:///F:/Guardian/server/app/routers/chaos.py) |
| `GET /external/weather` | Route exists, service calls open-meteo (free, no auth). Returns `{}` on connect error — but route itself is **404**. The router prefix `/api/external` is correct. Needs server restart to reload. |
| `GET /external/live-context` | Same as above |
| `GET /external/ports/congestion` | Same as above |
| `GET /external/ports/disruptions` | Same as above |
| `GET /external/chokepoints` | Same as above |
| `GET /external/news` | Route exists but needs `NEWS_API_KEY` env var — falls back to `[]` gracefully |

> [!NOTE]
> External routes are correctly defined in [external_data.py](file:///F:/Guardian/server/app/routers/external_data.py). The 404s are caused by the server's in-memory router state being stale — the external router was added after the server started. Because the server is currently live, **a restart is needed** for the external routes to take effect, but no code changes are needed there.

---

## Proposed Changes

### 1. Fix [dice_service.py](file:///F:/Guardian/server/app/services/dice_service.py) — Add missing wrapper

#### [MODIFY] [dice_service.py](file:///F:/Guardian/server/app/services/dice_service.py)

Add `generate_dice_for_shipment(shipment_id, horizon_hours)` at the bottom of the file. This wrapper:
1. Fetches the shipment from MongoDB synchronously (using `asyncio.run` or by making the router endpoint `async` and calling services correctly)
2. Calls [generate_counterfactuals(shipment, horizon_hours)](file:///F:/Guardian/server/app/services/dice_service.py#125-254)

> [!IMPORTANT]
> The router endpoint [get_dice](file:///F:/Guardian/server/app/routers/shipments.py#55-63) is `async` but calls `generate_dice_for_shipment` synchronously. The wrapper must fetch from MongoDB. We'll make the wrapper truly async and update the router to `await` it.

---

### 2. Fix [kimi_service.py](file:///F:/Guardian/server/app/services/kimi_service.py) — Add missing wrapper

#### [MODIFY] [kimi_service.py](file:///F:/Guardian/server/app/services/kimi_service.py)

Add `generate_kimi_for_shipment(shipment_id, horizon_hours)` that:
1. Fetches shipment from MongoDB
2. Calls [generate_counterfactuals()](file:///F:/Guardian/server/app/services/dice_service.py#125-254) from dice_service to get DiCE options
3. Calls [get_intervention_recommendation(shipment, dice_result)](file:///F:/Guardian/server/app/services/kimi_service.py#117-180) 
4. Returns the full recommendation dict

---

### 3. Fix [chaos.py](file:///F:/Guardian/server/app/routers/chaos.py) — Add 3 missing routes

#### [MODIFY] [chaos.py](file:///F:/Guardian/server/app/routers/chaos.py)

**A. Add `POST /ripple/{shipment_id}`** — propagates risk from one shipment through the network:
```python
@router.post("/ripple/{shipment_id}")
async def ripple_from_shipment(shipment_id: str, base_risk: float = 0.78):
    # Fetch shipment, use PROPAGATION_GRAPH, return propagated risks
```

**B. Change `GET /batch-disruption` → `POST /batch-disruption`** — test expects POST method.

**C. Add `GET /graph/summary`** — returns node/edge summary of the PROPAGATION_GRAPH:
```python
@router.get("/graph/summary")
async def graph_summary():
    # Return edges, node count, connectivity summary
```

---

### 4. Restart the server

The external routes (`/api/external/*`) are correctly coded but need a server restart to register. No code changes required there.

---

## Verification Plan

### Automated Tests — re-run test script
```bash
cd F:\Guardian\server
python test_full_backend.py
```
Expected: all 11 previously failing tests → ✅

### Quick manual curl verification (after restart)
```bash
curl -s -X POST "http://localhost:8000/api/chaos/ripple/SHP_001?base_risk=0.78"
curl -s -X POST "http://localhost:8000/api/chaos/batch-disruption?hub=Mumbai&severity=8.0"
curl -s "http://localhost:8000/api/chaos/graph/summary"
curl -s "http://localhost:8000/api/external/weather"
curl -s "http://localhost:8000/api/external/live-context"
curl -s "http://localhost:8000/api/external/news"
curl -s "http://localhost:8000/api/external/chokepoints"
curl -s "http://localhost:8000/api/shipments/SHP_001/dice"
curl -s "http://localhost:8000/api/shipments/SHP_001/kimi"
```
Each should return a JSON body (not `{"detail":"Not Found"}`).
