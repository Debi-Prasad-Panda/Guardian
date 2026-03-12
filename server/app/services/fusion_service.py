# server/app/services/fusion_service.py
"""
Guardian — Three-Tower Fusion Orchestrator
Pipeline: Tower 2 (MiniLM) → Tower 1 (XGBoost) → fuse → Tower 3 (MLP)

Fusion vector layout — MUST match retrain_tower3_fast.py training layout:
  dims   0–499   XGBoost leaf embeddings  (500 dims, padded/trimmed)
  dims 500–883   MiniLM-L6-v2 embedding  (384 dims)
  dim    884     XGBoost calibrated risk_score  (1 dim)
  ─────────────────────────────────────────────────────────
  Total:          885 dims
"""
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Fusion vector constants — must match Tower 3 training
XGB_LEAF_DIM  = 500   # leaf embedding dims (pad/trim to this)
NLP_EMBED_DIM = 384   # MiniLM output dimension
FUSION_DIM    = 885   # XGB_LEAF_DIM + NLP_EMBED_DIM + 1


def build_fusion_vector(shipment: dict, horizon_hours: int = 48) -> np.ndarray:
    """
    Build the 885-dim fusion vector for Tower 3.

    Order of operations (critical):
        1. Tower 2 first  → 384-dim embedding + 3 NLP risk scores
        2. Inject NLP scores into shipment for Tower 1 features
        3. Tower 1        → leaf embeddings (500 dims) + risk_score
        4. Concatenate    → [leaf_emb(500) | nlp_emb(384) | risk_score(1)] = 885

    Parameters
    ----------
    shipment      : dict with at minimum 'alert_text'; other fields are optional
                    and fall back to sensible defaults
    horizon_hours : prediction horizon (24 | 48 | 72)

    Returns
    -------
    np.ndarray of shape (885,) dtype float32
    """
    from app.services.nlp_service import get_nlp_features
    from app.services.xgb_service import predict_tower1

    # ── Step 1: Tower 2 — text → embedding + 3 risk scores ───────────────────
    alert_text = str(shipment.get("alert_text", "No alerts today."))
    t2 = get_nlp_features(alert_text)

    nlp_embed = np.array(t2["nlp_embedding"], dtype=np.float32)  # (384,)
    if nlp_embed.shape[0] != NLP_EMBED_DIM:
        # keyword_fallback returns zeros(384) — shape should always be correct
        nlp_embed = np.zeros(NLP_EMBED_DIM, dtype=np.float32)

    # ── Step 2: Enrich shipment with T2 scores for XGBoost features ──────────
    nlp_scores = {
        "labor_strike_probability": t2["labor_strike_probability"],
        "geopolitical_risk_score":  t2["geopolitical_risk_score"],
        "news_sentiment_score":     t2.get("weather_severity_score", 0.0),
        # news_sentiment_score is the slot XGBoost has; map weather score here
    }

    # ── Step 3: Tower 1 — structured features → leaf embeddings + risk ───────
    t1 = predict_tower1(shipment, horizon_hours, nlp_scores=nlp_scores)
    raw_leaves  = t1["leaf_embeddings"]   # np.ndarray (num_trees,)
    t1_risk     = np.float32(t1["risk_score"])

    # Pad or trim leaf embeddings to exactly XGB_LEAF_DIM
    n = len(raw_leaves)
    if n >= XGB_LEAF_DIM:
        leaf_vec = raw_leaves[:XGB_LEAF_DIM].astype(np.float32)
    else:
        leaf_vec = np.concatenate([
            raw_leaves.astype(np.float32),
            np.zeros(XGB_LEAF_DIM - n, dtype=np.float32)
        ])

    # ── Step 4: Concatenate → 885-dim vector ─────────────────────────────────
    fused = np.concatenate([
        leaf_vec,             # dims 0–499    (500)
        nlp_embed,            # dims 500–883  (384)
        [t1_risk],            # dim  884       (1)
    ]).astype(np.float32)

    if fused.shape[0] != FUSION_DIM:
        raise RuntimeError(
            f"Fusion vector shape mismatch: got {fused.shape[0]}, expected {FUSION_DIM}. "
            f"leaf={len(leaf_vec)}, nlp={len(nlp_embed)}, risk=1"
        )

    return fused


def predict_full_pipeline(shipment: dict, horizon_hours: int = 48) -> dict:
    """
    Run the complete three-tower inference pipeline for one shipment.

    Returns
    -------
    {
        "risk_score":               float   # Tower 3 MLP output (0–1)
        "uncertainty":              float   # MC-Dropout based uncertainty
        "confidence_label":         str     # "High confidence" / "Medium confidence" / "Monitor closely"
        "interval_low":             float   # risk_score - 1.96*uncertainty
        "interval_high":            float   # risk_score + 1.96*uncertainty
        "display":                  str     # human-readable summary
        "t1_risk":                  float   # Tower 1 XGBoost direct risk (for display)
        "nlp_source":               str     # "minilm" | "keyword_fallback"
        "labor_strike_probability": float   # Tower 2 output
        "geopolitical_risk_score":  float   # Tower 2 output
        "weather_severity_score":   float   # Tower 2 output
    }
    """
    from app.services.nlp_service import get_nlp_features
    from app.services.xgb_service import predict_tower1
    from app.services.mlp_service import predict_risk

    # ── Tower 2 ───────────────────────────────────────────────────────────────
    alert_text = str(shipment.get("alert_text", "No alerts today."))
    t2 = get_nlp_features(alert_text)

    nlp_scores = {
        "labor_strike_probability": t2["labor_strike_probability"],
        "geopolitical_risk_score":  t2["geopolitical_risk_score"],
        "news_sentiment_score":     t2.get("weather_severity_score", 0.0),
    }

    # ── Tower 1 ───────────────────────────────────────────────────────────────
    t1 = predict_tower1(shipment, horizon_hours, nlp_scores=nlp_scores)

    # ── Build fusion vector ───────────────────────────────────────────────────
    nlp_embed  = np.array(t2["nlp_embedding"], dtype=np.float32)
    if nlp_embed.shape[0] != NLP_EMBED_DIM:
        nlp_embed = np.zeros(NLP_EMBED_DIM, dtype=np.float32)

    raw_leaves = t1["leaf_embeddings"]
    n          = len(raw_leaves)
    if n >= XGB_LEAF_DIM:
        leaf_vec = raw_leaves[:XGB_LEAF_DIM].astype(np.float32)
    else:
        leaf_vec = np.concatenate([
            raw_leaves.astype(np.float32),
            np.zeros(XGB_LEAF_DIM - n, dtype=np.float32)
        ])

    fused = np.concatenate([
        leaf_vec,
        nlp_embed,
        [np.float32(t1["risk_score"])],
    ]).astype(np.float32)

    # ── Tower 3 ───────────────────────────────────────────────────────────────
    t3 = predict_risk(fused)

    return {
        **t3,   # risk_score, uncertainty, confidence_label, interval_low/high, display
        "t1_risk":                  t1["risk_score"],
        "nlp_source":               t2.get("source", "unknown"),
        "labor_strike_probability": t2["labor_strike_probability"],
        "geopolitical_risk_score":  t2["geopolitical_risk_score"],
        "weather_severity_score":   t2["weather_severity_score"],
    }
