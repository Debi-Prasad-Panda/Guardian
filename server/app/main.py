from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import random

from app.routers import shipments, chaos, ports, analytics

app = FastAPI(title="Guardian - AI Early Warning System API", version="3.0.0")

# CORS setup
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(shipments.router,  prefix="/api/shipments",          tags=["Shipments"])
app.include_router(chaos.router,      prefix="/api/chaos",              tags=["Chaos Simulator"])
app.include_router(ports.router,      prefix="/api/ports",              tags=["Port Congestion"])
app.include_router(analytics.router,  prefix="/api/analytics",          tags=["Analytics"])

# Dashboard overview — proxied from analytics router
@app.get("/api/dashboard/overview", tags=["Dashboard"])
def dashboard_overview():
    from app.routers.analytics import get_dashboard_overview
    return get_dashboard_overview()


@app.get("/")
def read_root():
    return {"message": "Guardian API v3.0 is running.", "docs": "/docs"}


# ─── WebSocket — Live Risk Updates ─────────────────────────────────────────────
LIVE_SHIPMENTS = [
    {"id": "SHP_001", "risk": 87, "tier": "CRITICAL", "route": "BLR→DEL"},
    {"id": "SHP_112", "risk": 92, "tier": "CRITICAL", "route": "MAA→PNQ"},
    {"id": "SHP_214", "risk": 65, "tier": "PRIORITY", "route": "CCU→BOM"},
    {"id": "SHP_451", "risk": 58, "tier": "PRIORITY", "route": "PNQ→AMD"},
    {"id": "SHP_047", "risk": 52, "tier": "PRIORITY", "route": "BOM→MAA"},
    {"id": "SHP_093", "risk": 18, "tier": "STANDARD", "route": "DEL→CCU"},
]

@app.websocket("/ws/risk-updates")
async def risk_updates_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Simulate slight fluctuations in risk scores as new data arrives
            updates = []
            for ship in LIVE_SHIPMENTS:
                delta = random.randint(-3, 3)
                new_risk = max(5, min(99, ship["risk"] + delta))
                ship["risk"] = new_risk  # drift the value over time
                updates.append({
                    "id": ship["id"],
                    "risk": new_risk,
                    "tier": ship["tier"],
                    "route": ship["route"],
                    "delta": delta,
                })

            payload = {
                "type": "risk_update",
                "timestamp": asyncio.get_event_loop().time(),
                "updates": updates,
                "total_monitored": 1247,
                "active_alerts": sum(1 for u in updates if u["risk"] >= 65),
                "saved_today_inr": random.randint(80000, 95000),
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(4)   # push update every 4 seconds
    except WebSocketDisconnect:
        print("WebSocket client disconnected cleanly")
    except Exception as e:
        print(f"WebSocket error: {e}")
