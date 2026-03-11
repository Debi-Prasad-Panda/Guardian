"""
Guardian Backend — Enhanced Chaos Lab Router
POST /api/chaos/inject → propagates disruption across shipment network
GET  /api/chaos/presets → scenario presets
GET  /api/chaos/network → risk propagation graph post-inject
"""
import random
from fastapi import APIRouter, Body

router = APIRouter()

PRESETS = [
    {"id": "suez",    "name": "Suez Canal Blockage (2021 Replay)",  "weather": 0, "strike": 0, "hub": "BOM", "description": "Global supply chain disruption from canal blockage. 320+ vessels stalled."},
    {"id": "monsoon", "name": "Mumbai Monsoon Season",              "weather": 85, "strike": 0, "hub": "BOM", "description": "Severe rainfall disrupting road freight and port operations."},
    {"id": "strike",  "name": "National Transport Strike (NH-44)",   "weather": 0, "strike": 90, "hub": "NAG", "description": "Nationwide truckers strike affecting all ground routes."},
    {"id": "typhoon", "name": "Chennai Cyclone Warning",             "weather": 92, "strike": 0, "hub": "MAA", "description": "Category 2 cyclone approaching Tamil Nadu coast, port closures likely."},
]

ROUTE_GRAPH = {
    "BOM": ["SHP_001","SHP_214","SHP_451"],
    "MAA": ["SHP_112","SHP_047"],
    "NAG": ["SHP_001","SHP_093","SHP_330"],
    "DEL": ["SHP_001","SHP_502","SHP_093"],
    "HYD": ["SHP_330","SHP_214"],
}

def _propagate(weather: int, strike: int, hub: str, base_shipments: int = 8) -> dict:
    severity = (weather * 0.6 + strike * 0.4) / 100.0
    affected_nodes = ROUTE_GRAPH.get(hub, [])
    affected_count = min(base_shipments, max(1, int(severity * base_shipments) + 2))
    interventions_triggered = max(0, affected_count - 1)
    savings_potential = int(affected_count * 85000 * severity)

    before_after = [
        {"shipment": f"SHP_{100+i*37:03d}" if i > 0 else "SHP_001",
         "risk_before": random.randint(20, 60),
         "risk_after": min(97, random.randint(65, 95)),
         "action_recommended": random.choice(["Air Cargo", "Re-route", "Buffer Stock", "Expedite"])}
        for i in range(min(5, affected_count))
    ]

    propagation_ripple = [
        {"node": n, "impact": round(severity * random.uniform(0.5, 1.0) * 100, 1)}
        for n in list(ROUTE_GRAPH.keys())
    ]

    return {
        "affected_shipments": affected_count,
        "interventions_triggered": interventions_triggered,
        "savings_potential_inr": savings_potential,
        "severity_score": round(severity * 100, 1),
        "affected_nodes": list(ROUTE_GRAPH.get(hub, {hub: []}).keys() if isinstance(ROUTE_GRAPH.get(hub), dict) else [hub]),
        "before_after": before_after,
        "propagation_ripple": propagation_ripple,
        "network_graph": _build_propagation_graph(hub, severity),
    }


def _build_propagation_graph(hub: str, severity: float) -> dict:
    hub_risk_boost = {
        "BOM": {"BOM": 91, "PNQ": 72, "BLR": 55, "DEL": 62},
        "MAA": {"MAA": 94, "CBE": 78, "HYD": 61, "PNQ": 48},
        "NAG": {"NAG": 88, "BHO": 82, "DEL": 79, "BLR": 55},
        "DEL": {"DEL": 87, "BHO": 71, "NAG": 60, "CCU": 44},
    }.get(hub, {})

    nodes = [
        {"id": "BLR", "label": "Bangalore",   "risk": hub_risk_boost.get("BLR", 22),  "type": "hub",    "x": 200, "y": 380},
        {"id": "PNQ", "label": "Pune",         "risk": hub_risk_boost.get("PNQ", 38),  "type": "relay",  "x": 155, "y": 260},
        {"id": "NAG", "label": "Nagpur",       "risk": hub_risk_boost.get("NAG", 72),  "type": "relay",  "x": 280, "y": 200},
        {"id": "BHO", "label": "Bhopal",       "risk": hub_risk_boost.get("BHO", 78),  "type": "relay",  "x": 255, "y": 130},
        {"id": "DEL", "label": "Delhi",        "risk": hub_risk_boost.get("DEL", 87),  "type": "dest",   "x": 270, "y": 55},
        {"id": "MAA", "label": "Chennai",      "risk": hub_risk_boost.get("MAA", 84),  "type": "port",   "x": 380, "y": 420},
        {"id": "CBE", "label": "Coimbatore",   "risk": hub_risk_boost.get("CBE", 45),  "type": "relay",  "x": 340, "y": 320},
        {"id": "HYD", "label": "Hyderabad",    "risk": hub_risk_boost.get("HYD", 31),  "type": "relay",  "x": 330, "y": 220},
        {"id": "BOM", "label": "Mumbai",       "risk": hub_risk_boost.get("BOM", 91),  "type": "port",   "x": 110, "y": 240},
        {"id": "CCU", "label": "Kolkata",      "risk": hub_risk_boost.get("CCU", 45),  "type": "relay",  "x": 470, "y": 190},
    ]

    # Amplify hub node
    for node in nodes:
        if node["id"] == hub:
            node["risk"] = min(99, int(node["risk"] * (1 + severity * 0.3)))
            node["type"] = "epicentre"

    edges = [
        {"source": "BLR", "target": "PNQ",  "shipments": 3, "congestion": round(0.42 + severity * 0.3, 2)},
        {"source": "PNQ", "target": "NAG",  "shipments": 2, "congestion": round(0.71 + severity * 0.2, 2)},
        {"source": "NAG", "target": "BHO",  "shipments": 2, "congestion": round(0.76 + severity * 0.15, 2)},
        {"source": "BHO", "target": "DEL",  "shipments": 2, "congestion": round(0.88 + severity * 0.1, 2)},
        {"source": "MAA", "target": "CBE",  "shipments": 2, "congestion": round(0.84 + severity * 0.15, 2)},
        {"source": "CBE", "target": "HYD",  "shipments": 1, "congestion": round(0.58 + severity * 0.25, 2)},
        {"source": "HYD", "target": "NAG",  "shipments": 1, "congestion": round(0.62 + severity * 0.2, 2)},
        {"source": "BLR", "target": "BOM",  "shipments": 1, "congestion": round(0.55 + severity * 0.35, 2)},
        {"source": "BOM", "target": "DEL",  "shipments": 1, "congestion": round(0.79 + severity * 0.2, 2)},
        {"source": "CCU", "target": "BOM",  "shipments": 1, "congestion": round(0.44 + severity * 0.3, 2)},
    ]
    # Cap congestion at 1.0
    for e in edges:
        e["congestion"] = min(1.0, e["congestion"])
    return {"nodes": nodes, "edges": edges}


@router.post("/inject")
def inject_chaos(params: dict = Body(...)):
    weather = int(params.get("weather", 50))
    strike  = int(params.get("strike", 50))
    hub     = str(params.get("hub", "BOM"))
    return _propagate(weather, strike, hub)


@router.get("/presets")
def get_presets():
    return PRESETS


@router.get("/network")
def get_baseline_network():
    """Baseline network graph before chaos injection."""
    return _build_propagation_graph("BOM", 0.0)
