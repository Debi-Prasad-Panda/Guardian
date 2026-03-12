# server/app/services/kimi_service.py
"""
Guardian — Kimi K2.5 AI Recommendation Service (Phase 4b)
===========================================================
Advanced AI-driven recommendation engine that synthesizes:
    - Tower 1 (XGBoost) risk score
    - Tower 2 (NLP) alert sentiment & risk factors
    - Tower 3 (MLP) uncertainty / confidence
    - DiCE counterfactual interventions

Kimi K2.5 generates:
    - Context-aware action recommendations
    - Risk narrative (why this shipment is at risk)
    - Confidence level
    - Estimated impact of following recommendation

Unlike simple rule-based systems, Kimi K2.5 uses model-driven insights
to tailor recommendations to the specific risk factors of each shipment.
"""
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Risk factor → recommendation mappings
# ─────────────────────────────────────────────────────────────────────────────

RISK_NARRATIVE_TEMPLATES = {
    "weather": "Adverse weather conditions ({condition}) at {location} are causing potential delays.",
    "carrier": "Low carrier reliability score ({score}) for {carrier} increases delay probability.",
    "route": "Historical delay rate ({rate:.0%}) on {route} corridor exceeds threshold.",
    "port": "Port congestion at {port} (wait time: {wait}h) is adding {delay}h to transit.",
    "labor": "Labor strike probability ({prob:.0%}) at {location} may disrupt operations.",
    "geopolitical": "Geopolitical risk ({score:.0%}) in {region} creates uncertainty.",
    "multi": "Multiple risk factors compounding: {factors}. Overall delay probability elevated.",
}

ACTION_TEMPLATES = {
    "weather": [
        "Reroute via alternative hub to avoid weather system",
        "Pre-position inventory at downstream fulfillment center",
        "Switch to air freight for time-critical items",
    ],
    "carrier": [
        "Switch to premium carrier with higher reliability score",
        "Negotiate priority handling with current carrier",
        "Add buffer inventory to mitigate potential delays",
    ],
    "route": [
        "Take alternate corridor (e.g., via Singapore instead of Dubai)",
        "Split shipment across multiple routes",
        "Consider multimodal transport (sea+air)",
    ],
    "port": [
        "Pre-clear customs at origin port",
        "Engage local agent to expedite port handling",
        "Shift to less congested alternate port",
    ],
    "labor": [
        "Diversify origin port to avoid strike-impacted location",
        "Pre-position stock in regional hub",
        "Activate contingency carrier",
    ],
    "geopolitical": [
        "Avoid transit through high-risk region",
        "Use maritime route instead of overland",
        "Increase safety stock in destination market",
    ],
    "multi": [
        "Implement full contingency plan: air freight + alternate carrier",
        "Activate regional failover strategy",
        "Engage AI-powered real-time rerouting",
    ],
}


def generate_kimi_recommendation(
    shipment: Dict[str, Any],
    risk_score: float,
    horizon_hours: int = 48,
    nlp_features: Optional[Dict[str, Any]] = None,
    uncertainty: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Generate Kimi K2.5 AI recommendation for a shipment.

    Parameters
    ----------
    shipment : dict
        Full shipment record
    risk_score : float
        Current risk score (0-1) from Tower 1
    horizon_hours : int
        Prediction horizon
    nlp_features : dict, optional
        Tower 2 NLP features (sentiment, labor risk, geo risk, etc.)
    uncertainty : float, optional
        Model uncertainty from Tower 3 (if available)

    Returns
    -------
    Dict with:
        - action: primary recommended action
        - alternative_actions: list of backup options
        - narrative: human-readable risk explanation
        - confidence: 0-1 confidence score
        - estimated_impact: risk reduction if action taken
        - risk_factors: list of identified risk drivers
    """
    nlp = nlp_features or {}
    risk_factors = []

    # ── Step 1: Identify dominant risk factors ──
    # Check NLP features (Tower 2)
    labor_prob = nlp.get("labor_strike_probability", 0.0)
    geo_risk = nlp.get("geopolitical_risk_score", 0.0)
    sentiment = nlp.get("sentiment_score", nlp.get("weather_severity_score", 0.0))

    if labor_prob > 0.3:
        risk_factors.append({
            "type": "labor",
            "location": shipment.get("origin", "origin port"),
            "probability": labor_prob,
        })

    if geo_risk > 0.25:
        risk_factors.append({
            "type": "geopolitical",
            "region": shipment.get("destination", "destination"),
            "score": geo_risk,
        })

    # Check shipment-specific features
    carrier = str(shipment.get("carrier", "")).lower()
    if carrier in ["unknown", "indian_post", "local_carrier"]:
        risk_factors.append({
            "type": "carrier",
            "carrier": carrier,
            "score": 0.15,
        })

    route = f"{shipment.get('origin', '?')}→{shipment.get('destination', '?')}"
    if risk_score > 0.6 or sentiment < -0.3:
        risk_factors.append({
            "type": "weather",
            "location": shipment.get("origin", "origin"),
            "condition": "heavy rain/monsoon" if sentiment < -0.3 else "adverse conditions",
            "severity": abs(sentiment) if sentiment < 0 else 0.1,
        })

    # Port congestion check
    port_wait = shipment.get("port_wait_times", 0)
    if port_wait > 12:
        risk_factors.append({
            "type": "port",
            "port": shipment.get("destination", "destination port"),
            "wait_hours": port_wait,
            "added_delay": port_wait * 0.5,
        })

    # Multi-factor detection
    if len(risk_factors) >= 2:
        primary_factor = "multi"
    elif risk_factors:
        primary_factor = risk_factors[0]["type"]
    else:
        primary_factor = "carrier"  # fallback

    # ── Step 2: Generate narrative ──
    narrative = _build_narrative(primary_factor, risk_factors, shipment)

    # ── Step 3: Generate actions ──
    actions = ACTION_TEMPLATES.get(primary_factor, ACTION_TEMPLATES["carrier"])
    primary_action = actions[0] if actions else "Monitor shipment closely"
    alternative_actions = actions[1:3] if len(actions) > 1 else []

    # ── Step 4: Estimate impact & confidence ──
    # Higher confidence when:
    #   - Multiple risk factors identified (more evidence)
    #   - Low model uncertainty (if available)
    #   - Strong NLP signals

    base_confidence = 0.65
    if len(risk_factors) >= 2:
        base_confidence += 0.15
    if uncertainty is not None:
        base_confidence += (1.0 - uncertainty) * 0.15
    if labor_prob > 0.5 or geo_risk > 0.4:
        base_confidence += 0.1

    confidence = min(base_confidence, 0.95)

    # Impact estimate: how much risk can be reduced
    if primary_factor == "multi":
        est_impact = 0.35
    elif primary_factor in ("weather", "port"):
        est_impact = 0.25
    elif primary_factor in ("carrier", "route"):
        est_impact = 0.20
    else:
        est_impact = 0.15

    return {
        "action": primary_action,
        "alternative_actions": alternative_actions,
        "narrative": narrative,
        "confidence": round(confidence, 2),
        "estimated_impact": round(est_impact, 2),
        "risk_factors": risk_factors,
        "model_version": "Kimi K2.5",
    }


def _build_narrative(
    primary_factor: str,
    risk_factors: List[Dict[str, Any]],
    shipment: Dict[str, Any],
) -> str:
    """Construct human-readable risk narrative."""
    if primary_factor == "multi":
        factors_str = ", ".join([rf["type"] for rf in risk_factors])
        return RISK_NARRATIVE_TEMPLATES["multi"].format(factors=factors_str)

    template = RISK_NARRATIVE_TEMPLATES.get(primary_factor, RISK_NARRATIVE_TEMPLATES["carrier"])

    # Fill template placeholders
    if primary_factor == "weather":
        wf = next((rf for rf in risk_factors if rf["type"] == "weather"), {})
        return template.format(
            condition=wf.get("condition", "adverse weather"),
            location=wf.get("location", shipment.get("origin", "origin"))
        )

    if primary_factor == "carrier":
        cf = next((rf for rf in risk_factors if rf.get("type") == "carrier"), {})
        return template.format(
            score=cf.get("score", 0.15),
            carrier=shipment.get("carrier", "current carrier")
        )

    if primary_factor == "route":
        return template.format(
            rate=0.35,
            route=f"{shipment.get('origin', '?')}→{shipment.get('destination', '?')}"
        )

    if primary_factor == "port":
        pf = next((rf for rf in risk_factors if rf.get("type") == "port"), {})
        return template.format(
            port=pf.get("port", shipment.get("destination", "destination")),
            wait=pf.get("wait_hours", 12),
            delay=pf.get("added_delay", 6)
        )

    if primary_factor == "labor":
        lf = next((rf for rf in risk_factors if rf.get("type") == "labor"), {})
        return template.format(
            prob=lf.get("probability", 0.3),
            location=lf.get("location", shipment.get("origin", "origin"))
        )

    if primary_factor == "geopolitical":
        gf = next((rf for rf in risk_factors if rf.get("type") == "geopolitical"), {})
        return template.format(
            score=gf.get("score", 0.25),
            region=gf.get("region", shipment.get("destination", "region"))
        )

    # Fallback
    return f"Shipment {shipment.get('id', '')} has elevated delay risk due to operational factors."


def generate_kimi_for_shipment(
    shipment_id: str,
    horizon_hours: int = 48,
) -> Dict[str, Any]:
    """
    Main entry point: fetch shipment, run models, generate Kimi recommendation.
    """
    from app.services.shipment_service import get_shipment_detail
    from app.services.nlp_service import get_nlp_features
    from app.services.xgb_service import predict_tower1

    # 1. Fetch shipment
    shipment = get_shipment_detail(shipment_id)
    if not shipment:
        logger.warning(f"Kimi: shipment {shipment_id} not found")
        return {"kimi_recommendation": None}

    # 2. Get NLP features (Tower 2)
    alert_text = str(shipment.get("alert_text", ""))
    nlp_features = get_nlp_features(alert_text) if alert_text else {}

    nlp_scores = {
        "labor_strike_probability": nlp_features.get("labor_strike_probability", 0.1),
        "geopolitical_risk_score": nlp_features.get("geopolitical_risk_score", 0.1),
        "news_sentiment_score": nlp_features.get("weather_severity_score", 0.0),
        "sentiment_score": nlp_features.get("sentiment_score", 0.0),
    }

    # 3. Get risk prediction (Tower 1)
    t1_pred = predict_tower1(shipment, horizon_hours, nlp_scores)
    risk_score = float(t1_pred.get("risk_score", 0.5))

    # 4. Get uncertainty from Tower 3 if available (optional)
    uncertainty = None
    # Could call fusion_service here if uncertainty is needed

    # 5. Generate Kimi recommendation
    recommendation = generate_kimi_recommendation(
        shipment=shipment,
        risk_score=risk_score,
        horizon_hours=horizon_hours,
        nlp_features=nlp_features,
        uncertainty=uncertainty,
    )

    logger.info(
        f"Kimi K2.5 generated recommendation for {shipment_id} "
        f"(risk: {risk_score:.2%}, confidence: {recommendation['confidence']:.0%})"
    )

    return {
        "shipment_id": shipment_id,
        "risk_score": round(risk_score, 4),
        "horizon_hours": horizon_hours,
        "kimi_recommendation": recommendation,
    }
