import os
import pickle
import numpy as np
import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Cache variables
_minilm = None
_regressors = {}
_score_names = []
_artifacts_loaded = False

def load_tower2():
    global _minilm, _regressors, _score_names, _artifacts_loaded
    if _artifacts_loaded:
        return _minilm, _regressors, _score_names

    try:
        logger.info("Loading Tower 2 NLP Minilm model and regressors...")
        _minilm = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        
        # Look for the artifacts in the models folder
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__))) # server dir
        artifact_path = os.path.join(base_dir, "models", "tower2_artifacts.pkl")
        
        with open(artifact_path, "rb") as f:
            artifacts = pickle.load(f)
            
        _regressors = artifacts.get("regressors", {})
        _score_names = artifacts.get("score_names", [])
        
        _artifacts_loaded = True
        logger.info("Tower 2 NLP models successfully loaded.")
        
    except Exception as e:
        logger.error(f"Failed to load Tower 2 models: {e}")
        _artifacts_loaded = False
        
    return _minilm, _regressors, _score_names

def keyword_fallback(alert_text: str) -> dict:
    """Rule-based fallback when MiniLM unavailable"""
    text = alert_text.lower()
    
    labor_kw = ["strike", "walkout", "labor", "union", "picket", "stoppage", "workers"]
    geo_kw = ["tariff", "sanction", "blockage", "conflict", "war", "restriction", "ban"]
    wx_kw = ["typhoon", "flood", "storm", "cyclone", "hurricane", "snow", "fog"]
    
    labor_score = 0.85 if any(w in text for w in labor_kw) else 0.08
    geo_score = 0.85 if any(w in text for w in geo_kw) else 0.08
    wx_score = 0.85 if any(w in text for w in wx_kw) else 0.08

    return {
        "labor_strike_probability": labor_score,
        "geopolitical_risk_score": geo_score,
        "weather_severity_score": wx_score,
        # fallback returns 0s for embeddings so the rest of system doesn't crash
        "nlp_embedding": np.zeros(384).tolist(), 
        "alert_text": alert_text,
        "source": "keyword_fallback"
    }

def get_nlp_features(alert_text: str) -> dict:
    """
    Input:  raw alert text string
    Output: dict with 3 risk scores + 384-dim embedding
    """
    # Attempt to load model
    minilm, regressors, score_names = load_tower2()
    
    if not _artifacts_loaded:
        logger.warning("Tower 2 artifacts not loaded. Using keyword fallback.")
        return keyword_fallback(alert_text)
    
    try:
        # Step 1: encode text to 384-dim embedding
        embedding = minilm.encode([alert_text], normalize_embeddings=True)[0]
        
        # Step 2: predict 3 risk scores
        scores = {}
        for name, reg in regressors.items():
            raw = reg.predict([embedding])[0]
            scores[name] = float(np.clip(raw, 0.0, 1.0))
            
        return {
            "labor_strike_probability":  scores.get("labor_strike_probability", 0.0),
            "geopolitical_risk_score":   scores.get("geopolitical_risk_score", 0.0),
            "weather_severity_score":    scores.get("weather_severity_score", 0.0),
            "nlp_embedding":             embedding.tolist(),   # 384-dim, for MLP fusion (converted to list so it's JSON serializable if needed)
            "alert_text":                alert_text,
            "source":                    "minilm"
        }
        
    except Exception as e:
        logger.error(f"Error during NLP feature extraction: {e}. Falling back to keyword search.")
        return keyword_fallback(alert_text)
