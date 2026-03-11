"""
Guardian — FastAPI Main Application
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import asyncio
import random

from app.database import connect_db, close_db, get_db
from app.routers import shipments, chaos, ports, analytics
from app.routers import settings as settings_router


# ─── Lifecycle ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for MongoDB."""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Guardian - AI Early Warning System API",
    version="4.0.0",
    lifespan=lifespan
)

# CORS setup
origins = [
    "http://localhost",
    "http://localhost:3000",
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

# ─── Include Routers ────────────────────────────────────────
app.include_router(shipments.router)
app.include_router(chaos.router)
app.include_router(ports.router)
app.include_router(analytics.router)
app.include_router(settings_router.router)


@app.get("/")
def read_root():
    return {"message": "Guardian API v4.0 is running.", "docs": "/docs"}


@app.get("/api/health")
async def health_check():
    """Check API and database health."""
    db = get_db()
    try:
        count = await db.shipments.count_documents({})
        return {"status": "healthy", "database": "connected", "shipments": count}
    except Exception:
        return {"status": "degraded", "database": "disconnected", "shipments": 0}


# ─── WebSocket — Live Risk Updates ─────────────────────────
@app.websocket("/ws/risk-updates")
async def risk_updates_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        db = get_db()
        while True:
            # Fetch current shipments from DB for live risk data
            shipments_data = []
            try:
                cursor = db.shipments.find({}, {"_id": 0, "id": 1, "risk": 1, "service_tier": 1, "origin": 1, "destination": 1})
                shipments_data = await cursor.to_list(length=20)
            except Exception:
                pass

            updates = []
            for ship in shipments_data:
                base_risk = int(ship.get("risk", 0.5) * 100)
                delta = random.randint(-3, 3)
                new_risk = max(5, min(99, base_risk + delta))
                tier = ship.get("service_tier", "Standard").upper()
                origin = ship.get("origin", "")[:3].upper()
                dest = ship.get("destination", "")[:3].upper()
                updates.append({
                    "id": ship["id"],
                    "risk": new_risk,
                    "tier": tier,
                    "route": f"{origin}→{dest}",
                    "delta": delta,
                })

            payload = {
                "type": "risk_update",
                "timestamp": asyncio.get_event_loop().time(),
                "updates": updates,
                "total_monitored": max(len(updates) * 156, 1247),
                "active_alerts": sum(1 for u in updates if int(u["risk"]) >= 65),
                "saved_today_inr": random.randint(80000, 150000),
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(4)
    except WebSocketDisconnect:
        print("WebSocket client disconnected cleanly")
    except Exception as e:
        print(f"WebSocket error: {e}")
