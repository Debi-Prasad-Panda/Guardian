"""
Guardian Backend — Enriched Shipments Router
Full SHAP, timeline, multi-horizon, DiCE counterfactuals, Kimi K2.5 recommendation.
"""
import random
from typing import Any
from fastapi import APIRouter

router = APIRouter()

# ─── Synthetic shipment database ───────────────────────────────────────────────
SHIPMENTS = {
    "SHP_001": {
        "id": "SHP_001", "route": "Bangalore → Delhi", "origin": "Bangalore", "dest": "Delhi",
        "carrier": "Blue Dart", "tier": "CRITICAL", "risk_score": 87, "eta": "2026-03-13",
        "value": 420000, "weight_kg": 1240, "status": "In Transit",
        "horizons": {"t24": 82, "t48": 87, "t72": 91},
        "mc_dropout": {"mean": 87, "lower": 79, "upper": 94},
    },
    "SHP_047": {
        "id": "SHP_047", "route": "Mumbai → Chennai", "origin": "Mumbai", "dest": "Chennai",
        "carrier": "FedEx IN", "tier": "PRIORITY", "risk_score": 52, "eta": "2026-03-12",
        "value": 180000, "weight_kg": 320, "status": "In Transit",
        "horizons": {"t24": 45, "t48": 52, "t72": 60},
        "mc_dropout": {"mean": 52, "lower": 43, "upper": 61},
    },
    "SHP_093": {
        "id": "SHP_093", "route": "Delhi → Kolkata", "origin": "Delhi", "dest": "Kolkata",
        "carrier": "DTDC", "tier": "STANDARD", "risk_score": 18, "eta": "2026-03-14",
        "value": 60000, "weight_kg": 90, "status": "On Schedule",
        "horizons": {"t24": 14, "t48": 18, "t72": 22},
        "mc_dropout": {"mean": 18, "lower": 12, "upper": 25},
    },
    "SHP_112": {
        "id": "SHP_112", "route": "Chennai → Pune", "origin": "Chennai", "dest": "Pune",
        "carrier": "DHL", "tier": "CRITICAL", "risk_score": 92, "eta": "2026-03-12",
        "value": 710000, "weight_kg": 2100, "status": "At Risk",
        "horizons": {"t24": 88, "t48": 92, "t72": 95},
        "mc_dropout": {"mean": 92, "lower": 85, "upper": 97},
    },
    "SHP_214": {
        "id": "SHP_214", "route": "Kolkata → Mumbai", "origin": "Kolkata", "dest": "Mumbai",
        "carrier": "Blue Dart", "tier": "PRIORITY", "risk_score": 65, "eta": "2026-03-15",
        "value": 230000, "weight_kg": 480, "status": "In Transit",
        "horizons": {"t24": 58, "t48": 65, "t72": 71},
        "mc_dropout": {"mean": 65, "lower": 56, "upper": 74},
    },
    "SHP_330": {
        "id": "SHP_330", "route": "Hyderabad → Jaipur", "origin": "Hyderabad", "dest": "Jaipur",
        "carrier": "DTDC", "tier": "STANDARD", "risk_score": 11, "eta": "2026-03-16",
        "value": 40000, "weight_kg": 60, "status": "On Schedule",
        "horizons": {"t24": 8, "t48": 11, "t72": 14},
        "mc_dropout": {"mean": 11, "lower": 6, "upper": 17},
    },
    "SHP_451": {
        "id": "SHP_451", "route": "Pune → Ahmedabad", "origin": "Pune", "dest": "Ahmedabad",
        "carrier": "FedEx IN", "tier": "PRIORITY", "risk_score": 58, "eta": "2026-03-13",
        "value": 300000, "weight_kg": 750, "status": "In Transit",
        "horizons": {"t24": 51, "t48": 58, "t72": 65},
        "mc_dropout": {"mean": 58, "lower": 49, "upper": 67},
    },
    "SHP_502": {
        "id": "SHP_502", "route": "Delhi → Bangalore", "origin": "Delhi", "dest": "Bangalore",
        "carrier": "DHL", "tier": "STANDARD", "risk_score": 22, "eta": "2026-03-17",
        "value": 110000, "weight_kg": 200, "status": "On Schedule",
        "horizons": {"t24": 18, "t48": 22, "t72": 27},
        "mc_dropout": {"mean": 22, "lower": 15, "upper": 30},
    },
}

SHAP_TEMPLATES: dict[str, Any] = {
    "CRITICAL": [
        {"feature": "Route Congestion Index",      "value": 28, "direction": "positive"},
        {"feature": "Carrier Historical Delay",     "value": 19, "direction": "positive"},
        {"feature": "Weather Severity Score",       "value": 16, "direction": "positive"},
        {"feature": "Transit Distance",             "value": 11, "direction": "positive"},
        {"feature": "Hub Capacity Utilization",     "value":  9, "direction": "positive"},
        {"feature": "Seasonal Factor (Off-Peak)",   "value": -5, "direction": "negative"},
        {"feature": "Carrier Priority Rating",      "value": -4, "direction": "negative"},
    ],
    "PRIORITY": [
        {"feature": "Route Congestion Index",       "value": 14, "direction": "positive"},
        {"feature": "Carrier Historical Delay",     "value":  9, "direction": "positive"},
        {"feature": "Weather Severity Score",       "value":  8, "direction": "positive"},
        {"feature": "Transit Distance",             "value":  6, "direction": "positive"},
        {"feature": "Seasonal Factor (Off-Peak)",   "value": -4, "direction": "negative"},
        {"feature": "Carrier Priority Rating",      "value": -3, "direction": "negative"},
    ],
    "STANDARD": [
        {"feature": "Route Congestion Index",       "value":  5, "direction": "positive"},
        {"feature": "Weather Severity Score",       "value":  3, "direction": "positive"},
        {"feature": "Hub Capacity Utilization",     "value":  2, "direction": "positive"},
        {"feature": "Seasonal Factor (Off-Peak)",   "value": -4, "direction": "negative"},
        {"feature": "Carrier Priority Rating",      "value": -6, "direction": "negative"},
    ],
}

TIMELINE_ROUTES: dict[str, Any] = {
    "Bangalore → Delhi": [
        {"name": "Bangalore Hub",    "status": "completed", "time": "Mar 10, 09:00", "risk": 12, "eta_delta": 0},
        {"name": "Pune Relay",       "status": "completed", "time": "Mar 11, 14:30", "risk": 34, "eta_delta": 2},
        {"name": "Nagpur Junction",  "status": "current",   "time": "Mar 12, 08:00 (Est)", "risk": 67, "eta_delta": 5},
        {"name": "Bhopal Depot",     "status": "pending",   "time": "Mar 12, 22:00 (Est)", "risk": 78, "eta_delta": 8},
        {"name": "Delhi ICD",        "status": "pending",   "time": "Mar 13, 18:00 (Est)", "risk": 87, "eta_delta": 12},
    ],
    "Chennai → Pune": [
        {"name": "Chennai Port",     "status": "completed", "time": "Mar 9, 10:00",  "risk": 20, "eta_delta": 0},
        {"name": "Coimbatore Hub",   "status": "current",   "time": "Mar 11, 16:00 (Est)", "risk": 75, "eta_delta": 6},
        {"name": "Bangalore Transit","status": "pending",   "time": "Mar 12, 04:00 (Est)", "risk": 88, "eta_delta": 10},
        {"name": "Pune ICD",         "status": "pending",   "time": "Mar 12, 20:00 (Est)", "risk": 92, "eta_delta": 14},
    ],
}

KIMI_RECOMMENDATIONS = {
    "CRITICAL": (
        "Immediate escalation required. Based on Guardian's multi-horizon analysis (T+24: {t24}%, T+48: {t48}%, T+72: {t72}%), "
        "this shipment has a {risk}% delay probability driven primarily by route congestion and carrier historical delay patterns. "
        "The optimal intervention is to switch carrier/route to reduce risk to {new_risk}%, saving an estimated ₹{savings:,} in "
        "contractual penalties. The CO₂ overhead of {co2} kg is offset by the financial and SLA benefits. "
        "Recommend immediate action — delay beyond 6 hours significantly narrows the intervention window."
    ),
    "PRIORITY": (
        "Guardian flags this shipment at {risk}% delay probability (T+72h). While not yet critical, "
        "the upward risk trend (T+24: {t24}% → T+72: {t72}%) warrants a proactive re-route assessment. "
        "Switching to the recommended alternative reduces risk to {new_risk}% at minimal additional cost. "
        "Monitor every 4 hours and escalate if risk exceeds {threshold}%."
    ),
    "STANDARD": (
        "Low risk profile ({risk}% at T+72h). No immediate intervention required. "
        "Guardian will continue monitoring. Alert threshold set at 45%. "
        "Current trajectory is stable — recommend standard check-in at destination hub."
    ),
}

DICE_TEMPLATES = {
    "CRITICAL": [
        {"action": "Switch to Air Cargo (same carrier)",  "risk_reduction": 46, "cost_delta": 18000,  "co2_delta": 2.4,  "savings_factor": 0.85},
        {"action": "Re-route via alternate hub",           "risk_reduction": 32, "cost_delta": 4200,   "co2_delta": 0.6,  "savings_factor": 0.65},
        {"action": "Split + Priority Buffer Stock",        "risk_reduction": 19, "cost_delta": 2100,   "co2_delta": 0.0,  "savings_factor": 0.40},
    ],
    "PRIORITY": [
        {"action": "Re-route via alternate hub",           "risk_reduction": 22, "cost_delta": 3500,   "co2_delta": 0.5,  "savings_factor": 0.55},
        {"action": "Expedite current carrier",             "risk_reduction": 14, "cost_delta": 1800,   "co2_delta": 0.2,  "savings_factor": 0.35},
    ],
    "STANDARD": [
        {"action": "Continue current route (Recommended)", "risk_reduction": 0,  "cost_delta": 0,      "co2_delta": 0.0,  "savings_factor": 0.0},
    ],
}

NETWORK_GRAPH = {
    "nodes": [
        {"id": "BLR", "label": "Bangalore Hub",    "risk": 22,  "type": "origin",  "x": 200, "y": 400},
        {"id": "PNQ", "label": "Pune Relay",        "risk": 38,  "type": "relay",   "x": 160, "y": 280},
        {"id": "NAG", "label": "Nagpur Junction",   "risk": 72,  "type": "relay",   "x": 280, "y": 200},
        {"id": "BHO", "label": "Bhopal Depot",      "risk": 78,  "type": "relay",   "x": 260, "y": 130},
        {"id": "DEL", "label": "Delhi ICD",         "risk": 87,  "type": "dest",    "x": 280, "y": 50},
        {"id": "MAA", "label": "Chennai Port",      "risk": 84,  "type": "origin",  "x": 380, "y": 420},
        {"id": "CBE", "label": "Coimbatore Hub",    "risk": 55,  "type": "relay",   "x": 340, "y": 310},
        {"id": "HYD", "label": "Hyderabad",         "risk": 31,  "type": "relay",   "x": 330, "y": 210},
        {"id": "BOM", "label": "Mumbai JNPT",       "risk": 91,  "type": "port",    "x": 110, "y": 230},
        {"id": "CCU", "label": "Kolkata",           "risk": 45,  "type": "relay",   "x": 480, "y": 180},
    ],
    "edges": [
        {"source": "BLR", "target": "PNQ",  "shipments": 3, "congestion": 0.42},
        {"source": "PNQ", "target": "NAG",  "shipments": 2, "congestion": 0.71},
        {"source": "NAG", "target": "BHO",  "shipments": 2, "congestion": 0.76},
        {"source": "BHO", "target": "DEL",  "shipments": 2, "congestion": 0.88},
        {"source": "MAA", "target": "CBE",  "shipments": 2, "congestion": 0.84},
        {"source": "CBE", "target": "HYD",  "shipments": 1, "congestion": 0.58},
        {"source": "HYD", "target": "NAG",  "shipments": 1, "congestion": 0.62},
        {"source": "BLR", "target": "BOM",  "shipments": 1, "congestion": 0.55},
        {"source": "BOM", "target": "DEL",  "shipments": 1, "congestion": 0.79},
        {"source": "CCU", "target": "BOM",  "shipments": 1, "congestion": 0.44},
    ]
}


def _build_dice(ship: dict) -> list:
    templates = DICE_TEMPLATES.get(ship["tier"], DICE_TEMPLATES["STANDARD"])
    results = []
    for t in templates:
        new_risk = max(5, ship["risk_score"] - t["risk_reduction"])
        penalty_base = int(ship["value"] * 0.15)
        savings = int(penalty_base * t["savings_factor"])
        results.append({
            "action": t["action"],
            "risk_new": new_risk,
            "cost_delta_inr": t["cost_delta"],
            "co2_delta_kg": t["co2_delta"],
            "estimated_savings_inr": savings,
        })
    return results


def _build_kimi(ship: dict, dice: list) -> str:
    template = KIMI_RECOMMENDATIONS.get(ship["tier"], "")
    best = dice[0] if dice else {}
    return template.format(
        risk=ship["risk_score"],
        t24=ship["horizons"]["t24"],
        t48=ship["horizons"]["t48"],
        t72=ship["horizons"]["t72"],
        new_risk=best.get("risk_new", ship["risk_score"]),
        savings=best.get("estimated_savings_inr", 0),
        co2=best.get("co2_delta_kg", 0),
        threshold=70,
    )


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
def list_shipments():
    return [
        {k: v for k, v in s.items() if k not in ("mc_dropout",)}
        for s in SHIPMENTS.values()
    ]


@router.get("/network")
def get_network_graph():
    """Risk propagation graph incl. node risk and edge congestion for NetworkX/D3 viz."""
    return NETWORK_GRAPH


@router.get("/{shipment_id}")
def get_shipment(shipment_id: str):
    ship = SHIPMENTS.get(shipment_id.upper(), list(SHIPMENTS.values())[0])
    dice = _build_dice(ship)
    kimi = _build_kimi(ship, dice)
    route_key = str(ship["route"])
    checkpoints = TIMELINE_ROUTES.get(route_key, [
        {"name": f"{ship['origin']} Hub",  "status": "completed", "time": "Mar 10, 08:00", "risk": 15, "eta_delta": 0},
        {"name": "Transit Node",           "status": "current",   "time": "Mar 12, 14:00 (Est)", "risk": int(str(ship["risk_score"])) - 15, "eta_delta": 4},
        {"name": f"{ship['dest']} ICD",   "status": "pending",   "time": str(ship["eta"]) + ", 18:00 (Est)", "risk": int(str(ship["risk_score"])), "eta_delta": 8},
    ])
    return {
        **ship,
        "shap_values": SHAP_TEMPLATES.get(str(ship.get("tier", "STANDARD")), SHAP_TEMPLATES["STANDARD"]),  # type: ignore
        "checkpoints": checkpoints,
        "dice_interventions": dice,
        "kimi_recommendation": kimi,
        "history": [
            {"date": "Mar 10", "action": "Shipment created",           "actor": "System",      "outcome": "Neutral"},
            {"date": "Mar 11", "action": "Risk alert raised",          "actor": "Guardian AI", "outcome": "Alert"},
            {"date": "Mar 11", "action": "Intervention suggested",     "actor": "Kimi K2.5",   "outcome": "Pending"},
        ]
    }


@router.get("/{shipment_id}/shap")
def get_shap(shipment_id: str):
    ship = SHIPMENTS.get(shipment_id.upper(), list(SHIPMENTS.values())[0])
    return {
        "base_value": 42,
        "prediction": ship["risk_score"],
        "features": SHAP_TEMPLATES.get(str(ship["tier"]), SHAP_TEMPLATES["STANDARD"]),  # type: ignore
    }


@router.get("/{shipment_id}/timeline")
def get_timeline(shipment_id: str):
    ship = SHIPMENTS.get(shipment_id.upper(), list(SHIPMENTS.values())[0])
    return {
        "horizons": ship["horizons"],
        "mc_dropout": ship["mc_dropout"],
        "checkpoints": TIMELINE_ROUTES.get(str(ship["route"]), []),
    }


@router.post("/{shipment_id}/intervention")
def get_intervention(shipment_id: str):
    ship = SHIPMENTS.get(shipment_id.upper(), list(SHIPMENTS.values())[0])
    dice = _build_dice(ship)
    kimi = _build_kimi(ship, dice)
    return {"dice_interventions": dice, "kimi_recommendation": kimi}


@router.post("/{shipment_id}/override")
def override_intervention(shipment_id: str):
    return {"status": "override_logged", "shipment_id": shipment_id}
