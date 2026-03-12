# server/app/services/dice_service.py
"""
Guardian — DiCE Counterfactual Engine
Generates mathematically-proven "what-if" scenarios for flagged shipments.
Runs on Tower 1 XGBoost (tabular features only — actionable levers).
"""
import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Cache for DiCE objects (expensive to rebuild)
_dice_explainer = None
_dice_data = None
_dice_model = None


def load_dice_explainer():
    """
    Load DiCE explainer once and cache.
    Uses Tower 1 XGBoost model + training artifacts.
    """
    global _dice_explainer, _dice_data, _dice_model
    
    if _dice_explainer is not None:
        return _dice_explainer
    
    try:
        import dice_ml
        from app.services.xgb_service import load_tower1
        
        booster, artifacts = load_tower1()
        
        # Get feature names and training data schema
        FINAL_FEATURES = artifacts.get("FINAL_FEATURES", [])
        
        # Build a minimal training dataframe for DiCE schema
        # DiCE needs to know feature ranges and types
        # We'll create a synthetic sample based on typical ranges
        sample_data = {
            "lead_time":                    [3.0, 5.0, 7.0, 10.0, 14.0],
            "lead_time_horizon_adjusted":   [1.0, 3.0, 5.0, 8.0, 12.0],
            "carrier_reliability":          [0.65, 0.75, 0.85, 0.90, 0.95],
            "route_delay_rate":             [0.10, 0.20, 0.30, 0.40, 0.50],
            "weather_severity_index":       [5.0, 15.0, 30.0, 50.0, 80.0],
            "port_wait_times":              [2.0, 8.0, 16.0, 24.0, 36.0],
            "demurrage_risk_flag":          [0, 0, 0, 1, 1],
            "shipping_mode_encoded":        [0, 0, 1, 1, 2],
            "service_tier_encoded":         [0, 1, 1, 2, 2],
            "prediction_horizon_hours":     [24.0, 48.0, 48.0, 72.0, 72.0],
            "news_sentiment_score":         [-0.3, -0.1, 0.0, 0.1, 0.2],
            "labor_strike_probability":     [0.05, 0.10, 0.20, 0.50, 0.85],
            "geopolitical_risk_score":      [0.05, 0.10, 0.20, 0.50, 0.85],
            "Late_delivery_risk":           [0, 0, 1, 1, 1],  # target
        }
        
        df = pd.DataFrame(sample_data)
        
        # Define continuous features (DiCE can modify these)
        continuous_features = [
            "lead_time",
            "lead_time_horizon_adjusted",
            "carrier_reliability",
            "route_delay_rate",
            "weather_severity_index",
            "port_wait_times",
            "news_sentiment_score",
            "labor_strike_probability",
            "geopolitical_risk_score",
        ]
        
        # Create DiCE data object
        _dice_data = dice_ml.Data(
            dataframe=df,
            continuous_features=continuous_features,
            outcome_name="Late_delivery_risk"
        )
        
        # Wrap XGBoost booster for DiCE
        # DiCE needs a predict_proba method
        class XGBWrapper:
            def __init__(self, booster, feature_names):
                self.booster = booster
                self.feature_names = feature_names
            
            def predict_proba(self, X):
                import xgboost as xgb
                if isinstance(X, pd.DataFrame):
                    X_arr = X[self.feature_names].values
                else:
                    X_arr = X
                dmat = xgb.DMatrix(X_arr, feature_names=self.feature_names)
                preds = self.booster.predict(dmat)
                # Return shape (n, 2) for binary classification
                return np.column_stack([1 - preds, preds])
        
        wrapped_model = XGBWrapper(booster, FINAL_FEATURES)
        
        _dice_model = dice_ml.Model(
            model=wrapped_model,
            backend="sklearn",
            model_type="classifier"
        )
        
        # Create DiCE explainer
        _dice_explainer = dice_ml.Dice(
            _dice_data,
            _dice_model,
            method="random"  # Fast method for hackathon demo
        )
        
        logger.info("✅ DiCE explainer loaded successfully")
        return _dice_explainer
        
    except ImportError:
        logger.error("dice-ml not installed. Run: pip install dice-ml")
        raise
    except Exception as e:
        logger.error(f"Failed to load DiCE explainer: {e}")
        raise


# ── Backward-compatible aliases ──────────────────────────────────────────────
# Some test scripts and router modules call these shorter names.
load_dice_engine = load_dice_explainer
load_dice_model  = load_dice_explainer


def generate_counterfactuals(
    shipment: Dict[str, Any],
    horizon_hours: int = 48,
    num_counterfactuals: int = 3,
    desired_class: str = "opposite"
) -> Dict[str, Any]:
    """
    Generate counterfactual explanations for a flagged shipment.
    
    Parameters
    ----------
    shipment            : dict with shipment fields
    horizon_hours       : prediction horizon (24 | 48 | 72)
    num_counterfactuals : how many alternative scenarios to generate
    desired_class       : "opposite" (flip prediction) or 0/1
    
    Returns
    -------
    {
        "original_risk":     float,
        "counterfactuals":   List[dict],  # each with changed_features, new_risk, feasibility
        "actionable_levers": List[str],   # which features can be changed
        "source":            "dice" | "fallback"
    }
    """
    try:
        from app.services.xgb_service import build_feature_row, predict_tower1
        
        # Get current risk
        t1_result = predict_tower1(shipment, horizon_hours)
        original_risk = t1_result["risk_score"]
        feature_row = t1_result["feature_row"]
        
        # If risk is already low, no need for counterfactuals
        if original_risk < 0.30:
            return {
                "original_risk": original_risk,
                "counterfactuals": [],
                "actionable_levers": [],
                "source": "low_risk",
                "message": "Risk already low — no intervention needed."
            }
        
        # Load DiCE
        explainer = load_dice_explainer()
        
        # Convert feature_row to DataFrame (DiCE expects this)
        from app.services.xgb_service import load_tower1
        _, artifacts = load_tower1()
        FINAL_FEATURES = artifacts.get("FINAL_FEATURES", list(feature_row.keys()))
        
        query_instance = pd.DataFrame([feature_row], columns=FINAL_FEATURES)
        
        # Generate counterfactuals
        dice_exp = explainer.generate_counterfactuals(
            query_instance,
            total_CFs=num_counterfactuals,
            desired_class=desired_class,
            proximity_weight=0.5,      # Balance between proximity and sparsity
            diversity_weight=1.0,      # Encourage diverse solutions
        )
        
        # Parse counterfactuals
        cf_df = dice_exp.cf_examples_list[0].final_cfs_df
        
        counterfactuals = []
        for idx, row in cf_df.iterrows():
            # Find which features changed
            changed = {}
            for feat in FINAL_FEATURES:
                original_val = feature_row[feat]
                new_val = row[feat]
                if abs(float(new_val) - float(original_val)) > 0.01:
                    changed[feat] = {
                        "from": round(float(original_val), 2),
                        "to": round(float(new_val), 2),
                        "delta": round(float(new_val) - float(original_val), 2)
                    }
            
            # Predict new risk with this counterfactual
            cf_shipment = {**shipment}
            # Map changed features back to shipment fields
            if "weather_severity_index" in changed:
                cf_shipment["weather_severity_index"] = changed["weather_severity_index"]["to"]
            if "carrier_reliability" in changed:
                # This would mean switching carrier — we'll note this
                pass
            if "port_wait_times" in changed:
                cf_shipment["port_wait_times"] = changed["port_wait_times"]["to"]
            
            cf_result = predict_tower1(cf_shipment, horizon_hours)
            new_risk = cf_result["risk_score"]
            
            # Assess feasibility
            feasibility = "HIGH"
            if len(changed) > 3:
                feasibility = "MEDIUM"
            if "carrier_reliability" in changed and changed["carrier_reliability"]["delta"] > 0.15:
                feasibility = "MEDIUM"  # Switching carrier is harder
            
            counterfactuals.append({
                "id": f"CF_{idx + 1}",
                "changed_features": changed,
                "new_risk": round(new_risk, 4),
                "risk_reduction": round(original_risk - new_risk, 4),
                "num_changes": len(changed),
                "feasibility": feasibility,
                "description": _describe_counterfactual(changed)
            })
        
        # Sort by risk reduction (best first)
        counterfactuals.sort(key=lambda x: x["risk_reduction"], reverse=True)
        
        # Identify actionable levers
        all_changed = set()
        for cf in counterfactuals:
            all_changed.update(cf["changed_features"].keys())
        
        return {
            "original_risk": round(original_risk, 4),
            "counterfactuals": counterfactuals[:num_counterfactuals],
            "actionable_levers": list(all_changed),
            "source": "dice",
            "message": f"Generated {len(counterfactuals)} counterfactual scenarios."
        }
        
    except Exception as e:
        logger.warning(f"DiCE generation failed: {e}. Using rule-based fallback.")
        return _fallback_counterfactuals(shipment, horizon_hours, original_risk)


def _describe_counterfactual(changed: Dict[str, Dict]) -> str:
    """Generate human-readable description of what changed."""
    descriptions = []
    
    if "weather_severity_index" in changed:
        delta = changed["weather_severity_index"]["delta"]
        if delta < 0:
            descriptions.append(f"Wait for weather to improve (severity -{abs(delta):.0f})")
        else:
            descriptions.append(f"Weather worsens by +{delta:.0f}")
    
    if "carrier_reliability" in changed:
        delta = changed["carrier_reliability"]["delta"]
        if delta > 0:
            descriptions.append(f"Switch to more reliable carrier (+{delta:.0%} reliability)")
        else:
            descriptions.append(f"Carrier reliability drops by {abs(delta):.0%}")
    
    if "port_wait_times" in changed:
        delta = changed["port_wait_times"]["delta"]
        if delta < 0:
            descriptions.append(f"Reduce port wait by {abs(delta):.0f}h (expedite customs)")
        else:
            descriptions.append(f"Port congestion increases by +{delta:.0f}h")
    
    if "lead_time" in changed:
        delta = changed["lead_time"]["delta"]
        if delta > 0:
            descriptions.append(f"Extend lead time by +{delta:.1f} days")
    
    if "labor_strike_probability" in changed:
        delta = changed["labor_strike_probability"]["delta"]
        if delta < 0:
            descriptions.append(f"Strike risk reduced by {abs(delta):.0%}")
    
    if not descriptions:
        descriptions.append("Multiple minor adjustments")
    
    return " | ".join(descriptions)


def _fallback_counterfactuals(shipment: Dict, horizon_hours: int, original_risk: float) -> Dict:
    """
    Rule-based fallback when DiCE is unavailable.
    Generates plausible what-if scenarios based on SHAP-like importance.
    """
    from app.services.xgb_service import predict_tower1
    
    counterfactuals = []
    
    # Scenario 1: Switch to more reliable carrier
    cf1 = {**shipment, "carrier": "FedEx-Premium"}
    cf1_result = predict_tower1(cf1, horizon_hours)
    counterfactuals.append({
        "id": "CF_1",
        "changed_features": {"carrier_reliability": {"from": 0.75, "to": 0.92, "delta": 0.17}},
        "new_risk": cf1_result["risk_score"],
        "risk_reduction": round(original_risk - cf1_result["risk_score"], 4),
        "num_changes": 1,
        "feasibility": "HIGH",
        "description": "Switch to premium carrier (FedEx, 92% reliability)"
    })
    
    # Scenario 2: Reduce weather exposure (reroute or delay)
    cf2 = {**shipment, "weather_severity_index": 10.0}
    cf2_result = predict_tower1(cf2, horizon_hours)
    counterfactuals.append({
        "id": "CF_2",
        "changed_features": {"weather_severity_index": {"from": 50.0, "to": 10.0, "delta": -40.0}},
        "new_risk": cf2_result["risk_score"],
        "risk_reduction": round(original_risk - cf2_result["risk_score"], 4),
        "num_changes": 1,
        "feasibility": "MEDIUM",
        "description": "Reroute to avoid severe weather zone"
    })
    
    # Scenario 3: Expedite customs (reduce port wait)
    cf3 = {**shipment, "port_wait_times": 4.0}
    cf3_result = predict_tower1(cf3, horizon_hours)
    counterfactuals.append({
        "id": "CF_3",
        "changed_features": {"port_wait_times": {"from": 24.0, "to": 4.0, "delta": -20.0}},
        "new_risk": cf3_result["risk_score"],
        "risk_reduction": round(original_risk - cf3_result["risk_score"], 4),
        "num_changes": 1,
        "feasibility": "HIGH",
        "description": "Expedite customs clearance (pre-clearance program)"
    })
    
    counterfactuals.sort(key=lambda x: x["risk_reduction"], reverse=True)
    
    return {
        "original_risk": round(original_risk, 4),
        "counterfactuals": counterfactuals,
        "actionable_levers": ["carrier_reliability", "weather_severity_index", "port_wait_times"],
        "source": "fallback",
        "message": "Using rule-based counterfactuals (DiCE unavailable)."
    }


async def generate_dice_for_shipment(
    shipment_id: str,
    horizon_hours: int = 48
) -> dict:
    """
    Async entry-point called by the shipments router.
    Fetches the shipment document from MongoDB by ID, then delegates to
    generate_counterfactuals which runs the DiCE / fallback logic.
    Returns a structured dict identical to generate_counterfactuals output,
    or an error dict when the shipment cannot be found.
    """
    from app.database import get_db

    db = get_db()
    shipment = await db.shipments.find_one({"id": shipment_id}, {"_id": 0})

    if not shipment:
        return {
            "error": f"Shipment {shipment_id} not found",
            "original_risk": None,
            "counterfactuals": [],
            "actionable_levers": [],
            "source": "not_found",
        }

    return generate_counterfactuals(shipment, horizon_hours=horizon_hours)
