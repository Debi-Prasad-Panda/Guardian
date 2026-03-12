# server/app/routers/ml.py
"""
Guardian ML Router — Three-Tower inference endpoints.

Endpoints:
  POST /api/ml/predict              Tower 3 direct (raw 885-dim vector)
  POST /api/ml/predict-shipment     Full pipeline (shipment_id → T2→T1→T3)
  POST /api/ml/intervention         DiCE + Kimi K2.5 intervention recommendation
  GET  /api/ml/health               Tower 3 readiness check
  GET  /api/ml/tower1/health        Tower 1 readiness check
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["ML"])


# ── Request / Response models ────────────────────────────────────────────────

class FusedVectorRequest(BaseModel):
    fused_vector: List[float]


class RiskResponse(BaseModel):
    risk_score:       float
    uncertainty:      float
    confidence_label: str
    interval_low:     float
    interval_high:    float
    display:          str


class ShipmentPredictRequest(BaseModel):
    """Accept either a shipment_id (DB lookup) or raw fields for ad-hoc inference."""
    shipment_id:      Optional[str]  = None
    # Shipment fields (used when shipment_id is None or as overrides)
    alert_text:       str   = "No alerts."
    mode:             str   = "Road"
    service_tier:     str   = "Priority"
    carrier:          str   = "unknown"
    origin:           str   = "India"
    destination:      str   = "India"
    days_scheduled:   float = 7.0
    prediction_horizon: int = 48


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/predict", response_model=RiskResponse)
async def predict_risk(req: FusedVectorRequest) -> Dict[str, Any]:
    """
    Tower 3 MLP direct inference.
    Input : 885-dim fused vector (pre-built externally)
    Output: risk_score ± uncertainty + confidence label
    """
    try:
        from app.services.mlp_service import predict_risk as _predict
        vector = np.array(req.fused_vector, dtype=np.float32)
        if vector.shape[0] == 0:
            raise ValueError("fused_vector must not be empty")
        return _predict(vector)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Tower 3 model not yet trained. Run model/retrain_tower3_fast.py first."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-shipment")
async def predict_shipment_risk(req: ShipmentPredictRequest) -> Dict[str, Any]:
    """
    Full three-tower pipeline for a shipment.

    If shipment_id is provided, the shipment is fetched from MongoDB and
    merged with any explicit fields in the request body (request fields win).

    Pipeline:
        Tower 2 (MiniLM)  → NLP scores + 384-dim embedding
        Tower 1 (XGBoost) → 13 structured features → leaf_embeddings + risk_score
        Fusion            → 885-dim vector
        Tower 3 (MLP)     → risk_score ± uncertainty
    """
    from app.services.fusion_service import predict_full_pipeline
    from app.database import get_db

    # Build base dict from request fields
    shipment_dict: Dict[str, Any] = {
        "alert_text":     req.alert_text,
        "mode":           req.mode,
        "service_tier":   req.service_tier,
        "carrier":        req.carrier,
        "origin":         req.origin,
        "destination":    req.destination,
        "days_scheduled": req.days_scheduled,
    }

    # If shipment_id given, fetch from DB and layer on top
    if req.shipment_id:
        try:
            db = get_db()
            doc = await db.shipments.find_one(
                {"id": req.shipment_id}, {"_id": 0}
            )
            if doc:
                # DB values as base, request overrides only if non-default
                shipment_dict = {**doc, **{
                    k: v for k, v in shipment_dict.items()
                    if k in doc  # only override keys that exist in DB doc
                }}
                # Always use request alert_text if explicitly provided
                if req.alert_text != "No alerts.":
                    shipment_dict["alert_text"] = req.alert_text
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Shipment {req.shipment_id} not found in database."
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e}")

    try:
        result = predict_full_pipeline(shipment_dict, req.prediction_horizon)
        return result
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"One or more models not loaded: {e}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def ml_health():
    """Check if Tower 3 MLP is loaded and ready."""
    try:
        from app.services.mlp_service import load_tower3
        _, meta = load_tower3()
        return {
            "status":    "ready",
            "model":     "Tower 3 MLP Fusion Head",
            "input_dim": meta["input_dim"],
            "auc":       round(meta.get("val_auc", 0.0), 4),
        }
    except Exception as e:
        return {"status": "unavailable", "reason": str(e)}


@router.get("/tower1/health")
async def tower1_health():
    """Check if Tower 1 XGBoost is loaded and ready."""
    try:
        from app.services.xgb_service import load_tower1
        booster, artifacts = load_tower1()
        features = artifacts.get("FINAL_FEATURES", [])
        return {
            "status":      "ready",
            "model":       "Tower 1 XGBoost",
            "features":    features,
            "num_features": len(features),
        }
    except Exception as e:
        return {"status": "unavailable", "reason": str(e)}


class InterventionRequest(BaseModel):
    """Request for intervention recommendation."""
    shipment_id:        Optional[str] = None
    # Shipment fields (used when shipment_id is None)
    alert_text:         str   = "No alerts."
    mode:               str   = "Road"
    service_tier:       str   = "Priority"
    carrier:            str   = "unknown"
    origin:             str   = "India"
    destination:        str   = "India"
    days_scheduled:     float = 7.0
    prediction_horizon: int   = 48
    num_counterfactuals: int  = 3


@router.post("/intervention")
async def get_intervention(req: InterventionRequest) -> Dict[str, Any]:
    """
    Full DiCE + Kimi K2.5 intervention pipeline.
    
    Pipeline:
        1. Run full three-tower prediction
        2. Generate DiCE counterfactuals (what-if scenarios)
        3. Call Kimi K2.5 to select best intervention
        4. Return intervention card with cost-benefit analysis
    
    This is the INNOVATION SHOWCASE endpoint — combines:
        - Tower 1 XGBoost (tabular risk)
        - Tower 2 MiniLM (NLP risk)
        - Tower 3 MLP (fusion + uncertainty)
        - DiCE (counterfactual explanations)
        - Kimi K2.5 (grounded LLM recommendation)
    """
    from app.services.fusion_service import predict_full_pipeline
    from app.services.dice_service import generate_counterfactuals
    from app.services.kimi_service import get_intervention_recommendation
    from app.database import get_db
    
    # Build shipment dict
    shipment_dict: Dict[str, Any] = {
        "alert_text":     req.alert_text,
        "mode":           req.mode,
        "service_tier":   req.service_tier,
        "carrier":        req.carrier,
        "origin":         req.origin,
        "destination":    req.destination,
        "days_scheduled": req.days_scheduled,
    }
    
    # Fetch from DB if shipment_id provided
    if req.shipment_id:
        try:
            db = get_db()
            doc = await db.shipments.find_one(
                {"id": req.shipment_id}, {"_id": 0}
            )
            if doc:
                shipment_dict = {**doc, **{
                    k: v for k, v in shipment_dict.items()
                    if k in doc
                }}
                if req.alert_text != "No alerts.":
                    shipment_dict["alert_text"] = req.alert_text
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Shipment {req.shipment_id} not found."
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DB error: {e}")
    
    try:
        # Step 1: Full three-tower prediction
        prediction = predict_full_pipeline(shipment_dict, req.prediction_horizon)
        
        # Step 2: Generate DiCE counterfactuals
        dice_result = generate_counterfactuals(
            shipment_dict,
            horizon_hours=req.prediction_horizon,
            num_counterfactuals=req.num_counterfactuals
        )
        
        # Step 3: Get Kimi K2.5 recommendation
        # TODO: Add SHAP top feature extraction here
        intervention = get_intervention_recommendation(
            shipment_dict,
            dice_result,
            shap_top_feature="weather_severity_index"  # placeholder
        )
        
        # Step 4: Combine all results
        return {
            "shipment_id":    req.shipment_id or "AD_HOC",
            "prediction":     prediction,
            "counterfactuals": dice_result,
            "intervention":   intervention,
            "timestamp":      "2025-01-28T14:30:00Z",  # TODO: use real timestamp
        }
        
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Model not loaded: {e}"
        )
    except Exception as e:
        logger.error(f"Intervention pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
