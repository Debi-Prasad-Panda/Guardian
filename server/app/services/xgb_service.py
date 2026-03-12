# server/app/services/xgb_service.py
"""
Tower 1 — XGBoost Delay Risk Service
Loads xgb_tower1_model.json (native XGBoost format) and tower1_artifacts.pkl.
Exposes:
    load_tower1()              → (booster, artifacts)
    build_feature_row(shipment) → dict of 13 features
    predict_tower1(shipment)    → {"risk_score": float, "leaf_embeddings": ndarray(500,)}
"""
import os
import pickle
import numpy as np
import logging

logger = logging.getLogger(__name__)

# ── Paths ────────────────────────────────────────────────────────────────────
# server/app/services/xgb_service.py  → go up 3 levels to project root
_HERE        = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(_HERE)))

MODEL_PATH    = os.path.join(_PROJECT_ROOT, "model", "v4", "xgb_tower1_model.json")
ARTIFACT_PATH = os.path.join(_PROJECT_ROOT, "server", "models", "tower1_artifacts.pkl")

# ── Encoding maps (must match training) ─────────────────────────────────────
SHIPPING_MODE_MAP = {
    "standard": 0, "second class": 0, "road": 0, "sea": 0, "ship": 0,
    "first class": 1, "express": 1, "flight": 1,
    "same day": 2, "air": 2,
}
SERVICE_TIER_MAP = {
    "standard": 0, "priority": 1, "critical": 2,
}

# ── Module-level cache ───────────────────────────────────────────────────────
_booster   = None
_artifacts = None


def load_tower1():
    """Load XGBoost booster and training artifacts (cached after first call)."""
    global _booster, _artifacts
    if _booster is not None:
        return _booster, _artifacts

    import xgboost as xgb

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Tower 1 model not found: {MODEL_PATH}")
    if not os.path.exists(ARTIFACT_PATH):
        raise FileNotFoundError(f"Tower 1 artifacts not found: {ARTIFACT_PATH}")

    _booster = xgb.Booster()
    _booster.load_model(MODEL_PATH)
    logger.info("✅ Tower 1 XGBoost booster loaded from %s", MODEL_PATH)

    with open(ARTIFACT_PATH, "rb") as f:
        _artifacts = pickle.load(f)
    logger.info("✅ Tower 1 artifacts loaded. Features: %s", _artifacts.get("FINAL_FEATURES"))

    return _booster, _artifacts


def build_feature_row(shipment: dict, horizon_hours: int = 48, nlp_scores: dict = None) -> dict:
    """
    Convert a raw shipment dict into the 13-feature row that XGBoost expects.

    Parameters
    ----------
    shipment      : dict from MongoDB or request body
    horizon_hours : prediction horizon (24 | 48 | 72)
    nlp_scores    : optional dict with keys labor_strike_probability,
                    geopolitical_risk_score, news_sentiment_score
                    (from Tower 2; falls back to shipment fields, then defaults)
    """
    _, artifacts = load_tower1()

    carrier_map = artifacts.get("carrier_reliability_map", {})
    route_map   = artifacts.get("route_delay_rate_map",
                  artifacts.get("route_delay_map", {}))

    # ── Lookup values ─────────────────────────────────────────────────────────
    carrier_id      = str(shipment.get("carrier", "unknown")).lower()
    origin          = str(shipment.get("origin", "india")).lower()
    destination     = str(shipment.get("destination", "india")).lower()
    route_key       = f"{origin}->{destination}"
    shipping_mode   = str(shipment.get("mode", "road")).lower()
    service_tier    = str(shipment.get("service_tier", "priority")).lower()

    carrier_reliability = carrier_map.get(carrier_id,
                          carrier_map.get("unknown", 0.85))
    route_delay_rate    = route_map.get(route_key, 0.25)

    # ── Numeric fields ────────────────────────────────────────────────────────
    lead_time   = float(shipment.get("days_scheduled",
                  shipment.get("lead_time", 7.0)))
    port_wait   = float(shipment.get("port_wait_times", 8.0))

    # Weather severity index: use precomputed if present, else derive from parts
    if "weather_severity_index" in shipment:
        weather_idx = float(shipment["weather_severity_index"])
    else:
        precip      = float(shipment.get("precipitation_mm", 5.0))
        wind        = float(shipment.get("wind_speed_kmh", 15.0))
        extreme     = int(shipment.get("extreme_weather_flag", 0))
        weather_idx = min(precip * 0.4 + wind * 0.3 + extreme * 30, 100.0)

    # ── NLP scores (Tower 2 takes precedence over shipment fields) ────────────
    if nlp_scores:
        labor_score = float(nlp_scores.get("labor_strike_probability",
                     shipment.get("labor_strike_probability", 0.10)))
        geo_score   = float(nlp_scores.get("geopolitical_risk_score",
                     shipment.get("geopolitical_risk_score", 0.10)))
        sentiment   = float(nlp_scores.get("news_sentiment_score",
                     shipment.get("news_sentiment_score", -0.10)))
    else:
        labor_score = float(shipment.get("labor_strike_probability", 0.10))
        geo_score   = float(shipment.get("geopolitical_risk_score", 0.10))
        sentiment   = float(shipment.get("news_sentiment_score", -0.10))

    return {
        "lead_time":                    lead_time,
        "lead_time_horizon_adjusted":   lead_time - (horizon_hours / 24.0),
        "carrier_reliability":          carrier_reliability,
        "route_delay_rate":             route_delay_rate,
        "weather_severity_index":       weather_idx,
        "port_wait_times":              port_wait,
        "demurrage_risk_flag":          int(port_wait > 24),
        "shipping_mode_encoded":        SHIPPING_MODE_MAP.get(shipping_mode, 0),
        "service_tier_encoded":         SERVICE_TIER_MAP.get(service_tier, 1),
        "prediction_horizon_hours":     float(horizon_hours),
        "news_sentiment_score":         sentiment,
        "labor_strike_probability":     labor_score,
        "geopolitical_risk_score":      geo_score,
    }


def predict_tower1(shipment: dict, horizon_hours: int = 48,
                   nlp_scores: dict = None) -> dict:
    """
    Run Tower 1 XGBoost inference.

    Returns
    -------
    {
        "risk_score":      float          # calibrated delay-risk probability (0–1)
        "leaf_embeddings": np.ndarray     # shape (num_trees,) int32 leaf indices
        "feature_row":     dict           # the 13 features used (for debugging / SHAP)
    }
    """
    import xgboost as xgb

    booster, artifacts = load_tower1()
    FINAL_FEATURES = artifacts.get("FINAL_FEATURES", list(
        build_feature_row(shipment, horizon_hours, nlp_scores).keys()
    ))

    row_dict  = build_feature_row(shipment, horizon_hours, nlp_scores)
    feat_vec  = np.array([row_dict[f] for f in FINAL_FEATURES],
                          dtype=np.float32).reshape(1, -1)
    dmat      = xgb.DMatrix(feat_vec, feature_names=FINAL_FEATURES)

    # Risk probability  (XGBoost raw score → sigmoid)
    raw_score  = float(booster.predict(dmat)[0])
    # XGBoost Booster.predict() with default returns sigmoid-transformed probability
    # for binary classification trained with xgb.train / XGBClassifier.
    risk_score = float(np.clip(raw_score, 0.0, 1.0))

    # Leaf indices  → used as structural embedding for fusion
    leaf_indices = booster.predict(dmat, pred_leaf=True)[0]  # shape: (num_trees,)
    leaf_embeddings = leaf_indices.astype(np.float32)

    return {
        "risk_score":      round(risk_score, 4),
        "leaf_embeddings": leaf_embeddings,
        "feature_row":     row_dict,
    }
