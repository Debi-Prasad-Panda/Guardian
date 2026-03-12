# server/app/services/dice_service.py
"""
Guardian — DiCE Counterfactual Generation Service (Phase 4b)
=============================================================
Generates real counterfactual interventions by perturbing shipment features
and re-predicting risk using the XGBoost model (Tower 1).

Each intervention shows:
    - what feature changed
    - new risk score after change
    - risk reduction (delta)
    - feasibility / action label

Approach:
    1. Take current shipment + baseline risk
    2. Generate candidate perturbations (carrier, mode, route, service tier, etc.)
    3. For each candidate, build perturbed feature row → predict new risk
    4. Sort by risk reduction (descending) → return top-K interventions
"""
import logging
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Intervention Templates — realistic perturbations to try
# ─────────────────────────────────────────────────────────────────────────────

INTERVENTION_TEMPLATES = [
    # Mode changes (most impactful)
    {
        "label": "Switch to Air Freight",
        "changes": {"mode": "air", "service_tier": "critical"},
        "optimal": False,
    },
    {
        "label": "Upgrade to Express Shipping",
        "changes": {"mode": "flight", "service_tier": "priority"},
        "optimal": False,
    },
    # Carrier changes
    {
        "label": "Switch to Premium Carrier (FedEx/DHL)",
        "changes": {"carrier": "fedex"},
        "optimal": False,
    },
    {
        "label": "Assign Reliable Carrier",
        "changes": {"carrier": "dhl"},
        "optimal": False,
    },
    # Route changes
    {
        "label": "Reroute via Alternative Hub",
        "changes": {"destination": "singapore"},
        "optimal": False,
    },
    {
        "label": "Divert to Regional Port",
        "changes": {"origin": "kolkata"},
        "optimal": False,
    },
    # Service tier changes
    {
        "label": "Priority Handling",
        "changes": {"service_tier": "critical"},
        "optimal": False,
    },
    {
        "label": "Upgrade to Priority Tier",
        "changes": {"service_tier": "priority"},
        "optimal": False,
    },
    # Combined interventions (most aggressive)
    {
        "label": "Full Intervention: Air + Premium Carrier",
        "changes": {"mode": "air", "carrier": "fedex", "service_tier": "critical"},
        "optimal": True,
    },
    {
        "label": "Express Reroute: Flight + Singapore Hub",
        "changes": {"mode": "flight", "destination": "singapore", "service_tier": "priority"},
        "optimal": True,
    },
]

# Known reliable carriers (higher carrier_reliability in model)
RELIABLE_CARRIERS = ["fedex", "dhl", "ups", "maersk", "msc"]
HIGH_RELIABILITY = 0.95
MEDIUM_RELIABILITY = 0.88
DEFAULT_RELIABILITY = 0.78


def generate_dice_interventions(
    shipment: Dict[str, Any],
    baseline_risk: float,
    horizon_hours: int = 48,
    nlp_scores: Optional[Dict[str, float]] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Generate counterfactual interventions for a shipment.

    Parameters
    ----------
    shipment : dict
        Current shipment record (from DB or request)
    baseline_risk : float
        Baseline risk score (0-1) from current prediction
    horizon_hours : int
        Prediction horizon (24, 48, or 72)
    nlp_scores : dict, optional
        NLP risk scores from Tower 2
    top_k : int
        Number of top interventions to return

    Returns
    -------
    List[Dict] — each intervention:
        {
            "label": str,
            "changes": dict,
            "new_risk": float,
            "risk_reduction": float,
            "feasibility": str,  # "high" | "medium" | "low"
            "optimal": bool,
        }
    """
    from app.services.xgb_service import build_feature_row, predict_tower1

    interventions = []

    for template in INTERVENTION_TEMPLATES:
        # Apply changes to a copy of shipment
        perturbed = {**shipment, **template["changes"]}

        # Build feature row with perturbed features
        try:
            feature_row = build_feature_row(perturbed, horizon_hours, nlp_scores)
        except Exception as e:
            logger.warning(f"DiCE: feature row build failed for {template['label']}: {e}")
            continue

        # Predict new risk
        try:
            pred = predict_tower1(perturbed, horizon_hours, nlp_scores)
            new_risk = float(pred.get("risk_score", baseline_risk))
        except Exception as e:
            logger.warning(f"DiCE: prediction failed for {template['label']}: {e}")
            new_risk = baseline_risk

        risk_reduction = baseline_risk - new_risk

        # Skip interventions that increase risk or have negligible effect
        if risk_reduction <= 0.01:
            continue

        # Determine feasibility based on cost/complexity
        feasibility = _assess_feasibility(template["changes"])

        interventions.append({
            "label": template["label"],
            "changes": template["changes"],
            "new_risk": round(new_risk, 4),
            "risk_reduction": round(risk_reduction, 4),
            "risk_reduction_pct": round(risk_reduction * 100, 1),
            "feasibility": feasibility,
            "optimal": template.get("optimal", False),
        })

    # Sort by risk reduction (descending)
    interventions.sort(key=lambda x: x["risk_reduction"], reverse=True)

    # Mark the best one as optimal if none marked
    if interventions and not any(i["optimal"] for i in interventions):
        interventions[0]["optimal"] = True

    return interventions[:top_k]


def _assess_feasibility(changes: Dict[str, Any]) -> str:
    """
    Heuristic feasibility assessment based on intervention complexity.
    """
    # Simple interventions (one change) → high feasibility
    if len(changes) == 1:
        return "high"

    # Medium complexity (two changes) → medium feasibility
    if len(changes) == 2:
        # Air freight is costlier → lower feasibility
        if changes.get("mode") in ("air", "flight"):
            return "medium"
        return "high"

    # Complex (3+ changes) → low feasibility
    return "low"


def generate_dice_for_shipment(
    shipment_id: str,
    horizon_hours: int = 48,
) -> Dict[str, Any]:
    """
    Main entry point: fetch shipment, compute baseline, generate interventions.
    """
    from app.database import get_db
    from app.services.shipment_service import get_shipment_detail
    from app.services.nlp_service import get_nlp_features
    from app.services.xgb_service import predict_tower1

    db = get_db()

    # 1. Fetch shipment
    shipment = get_shipment_detail(shipment_id)
    if not shipment:
        logger.warning(f"DiCE: shipment {shipment_id} not found")
        return {"dice_interventions": []}

    # 2. Get NLP scores (Tower 2) for feature enrichment
    alert_text = str(shipment.get("alert_text", ""))
    nlp_features = get_nlp_features(alert_text) if alert_text else {}
    nlp_scores = {
        "labor_strike_probability": nlp_features.get("labor_strike_probability", 0.1),
        "geopolitical_risk_score": nlp_features.get("geopolitical_risk_score", 0.1),
        "news_sentiment_score": nlp_features.get("weather_severity_score", 0.0),
    }

    # 3. Baseline prediction
    baseline_pred = predict_tower1(shipment, horizon_hours, nlp_scores)
    baseline_risk = float(baseline_pred.get("risk_score", 0.5))

    # 4. Generate interventions
    interventions = generate_dice_interventions(
        shipment=shipment,
        baseline_risk=baseline_risk,
        horizon_hours=horizon_hours,
        nlp_scores=nlp_scores,
        top_k=5,
    )

    logger.info(
        f"DiCE generated {len(interventions)} interventions for {shipment_id} "
        f"(baseline risk: {baseline_risk:.2%})"
    )

    return {
        "shipment_id": shipment_id,
        "baseline_risk": round(baseline_risk, 4),
        "horizon_hours": horizon_hours,
        "dice_interventions": interventions,
    }
