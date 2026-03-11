from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

from app.routers import shipments, chaos, ports, analytics

app = FastAPI(title="Guardian - AI Early Warning System API", version="3.0.0")

# CORS setup
origins = [
    "http://localhost",
    "http://localhost:5173", # Default Vite Dev Server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(shipments.router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(chaos.router, prefix="/api/chaos", tags=["Chaos Simulator"])
app.include_router(ports.router, prefix="/api/ports", tags=["Port Congestion"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {"message": "Guardian API is running."}

@app.websocket("/ws/risk-updates")
async def risk_updates_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Here we would normally yield dynamic data over time/when changed
            data = {"type": "ping", "message": "alive"}
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(5)
    except Exception as e:
        print(f"WebSocket connection closed: {e}")
