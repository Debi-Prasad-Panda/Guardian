"""
Guardian — Chaos Lab Router
Chaos injection and risk propagation simulation, using MongoDB shipment data.
XGBoost (Tower 1) enriches risk deltas when available; falls back to arithmetic.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.database import get_db
import random
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chaos", tags=["chaos"])


# ── Presets ──
PRESETS = [
    {
        "id": "suez_blockage",
        "name": "Suez Canal Blockage",
        "description": "Simulates a Suez Canal blockage — March 2021 scenario. ~400 vessels affected.",
        "params": {"weather_severity": 3, "port_strike": 0, "affected_hub": "Mumbai JNPT", "severity_override": 10}
    },
    {
        "id": "monsoon_surge",
        "name": "Monsoon Surge — West India",
        "description": "Severe monsoon flooding disrupts road freight in western India corridor.",
        "params": {"weather_severity": 9, "port_strike": 2, "affected_hub": "Mumbai JNPT", "severity_override": None}
    },
    {
        "id": "port_strike",
        "name": "Port Workers Strike — Chennai",
        "description": "Dock workers walkout at Chennai port halts operations.",
        "params": {"weather_severity": 1, "port_strike": 9, "affected_hub": "Chennai Port", "severity_override": None}
    },
    {
        "id": "multi_disruption",
        "name": "Multi-Region Disruption",
        "description": "Simultaneous weather + strike events across Mumbai and Kolkata.",
        "params": {"weather_severity": 7, "port_strike": 7, "affected_hub": "All", "severity_override": None}
    }
]


class ChaosParams(BaseModel):
    weather_severity: float = 5.0
    port_strike: float = 5.0
    affected_hub: str = "Mumbai JNPT"
    severity_override: Optional[float] = None


# ── Risk propagation logic ──
PROPAGATION_GRAPH = {
    "SHP_001": ["SHP_006", "SHP_008"],
    "SHP_002": ["SHP_007"],
    "SHP_006": ["SHP_001", "SHP_002"],
    "SHP_005": ["SHP_001"],
    "SHP_008": ["SHP_004"],
}


def propagate_risk(source_risks: Dict[str, float], graph: Dict, decay: float = 0.7) -> Dict[str, float]:
    """Propagate risk through the network with decay."""
    all_risks = dict(source_risks)
    for source, targets in graph.items():
        if source in source_risks:
            for target in targets:
                propagated = source_risks[source] * decay * random.uniform(0.8, 1.0)
                current = all_risks.get(target, 0)
                all_risks[target] = min(max(current, propagated), 1.0)
    return all_risks


@router.get("/presets")
async def get_presets():
    """Return available chaos simulation presets."""
    return PRESETS


def _xgb_enriched_risk(shipment: dict, weather_severity: float,
                        port_strike: float) -> Optional[float]:
    """
    Use Tower 1 XGBoost to compute a more realistic risk score for a chaos event.
    Returns None (silently) if models are not loaded.
    """
    try:
        from app.services.xgb_service import predict_tower1
        # Inject chaos parameters as feature overrides
        enriched = {
            **shipment,
            "weather_severity_index":    weather_severity * 10.0,
            "labor_strike_probability":  port_strike / 10.0,
            "geopolitical_risk_score":   port_strike / 12.0,
            "port_wait_times":           port_strike * 3.0,
            "news_sentiment_score":      -0.5 * (weather_severity / 10.0),
        }
        result = predict_tower1(enriched, horizon_hours=48)
        return result["risk_score"]
    except Exception as exc:
        logger.debug("Tower 1 unavailable for chaos enrichment: %s", exc)
        return None


@router.post("/inject")
async def inject_chaos(params: ChaosParams):
    """Inject a chaos event and compute propagation impact on network."""
    db = get_db()

    # Fetch all shipments
    shipments: List[Dict[str, Any]] = await db.shipments.find({}, {"_id": 0}).to_list(length=100)

    severity = params.severity_override or (params.weather_severity + params.port_strike) / 2.0
    severity_normalized = min(severity / 10.0, 1.0)

    # Determine which shipments are directly affected
    affected = []
    source_risks: Dict[str, float] = {}

    for s in shipments:
        is_affected = False
        if params.affected_hub == "All":
            is_affected = True
        elif params.affected_hub in (s.get("origin", ""), s.get("destination", "")):
            is_affected = True
        elif s.get("alert_text") and params.affected_hub.split()[0].lower() in s.get("alert_text", "").lower():
            is_affected = True

        if is_affected:
            base_risk: float = float(s.get("risk", 0))

            # Try XGBoost-informed risk; fall back to arithmetic
            t1_risk = _xgb_enriched_risk(
                s, params.weather_severity, params.port_strike
            )
            if t1_risk is not None:
                # Blend: take the higher of current base vs XGBoost prediction,
                # then add a small chaos delta for the "event shock"
                delta    = severity_normalized * random.uniform(0.05, 0.20)
                new_risk = min(max(base_risk, t1_risk) + delta, 0.99)
            else:
                # Arithmetic fallback (original behaviour)
                delta    = severity_normalized * random.uniform(0.3, 0.6)
                new_risk = min(base_risk + delta, 0.99)

            source_risks[s["id"]] = new_risk
            affected.append({
                "id": s["id"],
                "origin": s.get("origin", ""),
                "destination": s.get("destination", ""),
                "original_risk": round(float(base_risk), 2),
                "new_risk": round(float(new_risk), 2),
                "risk_delta": round(float(new_risk) - float(base_risk), 2),
                "status": "CRITICAL" if new_risk > 0.8 else "HIGH" if new_risk > 0.6 else "ELEVATED"
            })

    # Propagate risk to connected shipments
    propagated_risks = propagate_risk(source_risks, PROPAGATION_GRAPH)

    # Find indirectly affected
    indirectly_affected = []
    for sid, p_risk in propagated_risks.items():
        if sid not in source_risks:
            base = next((s.get("risk", 0) for s in shipments if s["id"] == sid), 0)
            if p_risk > base:
                ship = next((s for s in shipments if s["id"] == sid), None)
                if ship:
                    indirectly_affected.append({
                        "id": sid,
                        "origin": ship.get("origin", ""),
                        "destination": ship.get("destination", ""),
                        "original_risk": round(float(base), 2),
                        "new_risk": round(float(p_risk), 2),
                        "risk_delta": round(float(p_risk) - float(base), 2),
                        "status": "RIPPLE_EFFECT"
                    })

    return {
        "event": f"Chaos injection: severity={severity:.1f}, hub={params.affected_hub}",
        "directly_affected": len(affected),
        "indirectly_affected": len(indirectly_affected),
        "total_affected": len(affected) + len(indirectly_affected),
        "affected_shipments": affected,
        "ripple_effects": indirectly_affected,
        "severity": round(float(severity), 1),
        "message": (
            f"🔴 {len(affected)} shipments directly impacted, "
            f"{len(indirectly_affected)} via ripple propagation. "
            f"Total network disruption: {len(affected) + len(indirectly_affected)} shipments."
        )
    }
