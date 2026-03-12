"""
Guardian — Shipments Router
All shipment-related API endpoints, now backed by MongoDB.
"""
from fastapi import APIRouter, HTTPException
from app.services import shipment_service

router = APIRouter(prefix="/api/shipments", tags=["shipments"])


@router.get("/")
async def get_shipments():
    """Return all shipments for list view and map."""
    shipments = await shipment_service.get_all_shipments()
    if not shipments:
        return []
    return shipments


@router.get("/network")
async def get_network():
    """Return the risk propagation network graph."""
    graph = await shipment_service.get_network_graph()
    return graph


@router.get("/{shipment_id}")
async def get_shipment(shipment_id: str):
    """Return full shipment detail by ID."""
    detail = await shipment_service.get_shipment_detail(shipment_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")
    return detail


@router.get("/{shipment_id}/shap")
async def get_shap(shipment_id: str):
    """Return SHAP values for a shipment."""
    shap_data = await shipment_service.get_shipment_shap(shipment_id)
    if not shap_data:
        # Return default SHAP structure when no detail record exists
        return {"shap_values": []}
    return shap_data


@router.get("/{shipment_id}/timeline")
async def get_timeline(shipment_id: str):
    """Return timeline checkpoints + horizon risks for a shipment."""
    timeline_data = await shipment_service.get_shipment_timeline(shipment_id)
    if not timeline_data:
        return {"timeline": [], "horizon_risks": []}
    return timeline_data


@router.get("/{shipment_id}/dice")
async def get_dice(shipment_id: str, horizon: int = 48):
    """
    Return DiCE counterfactual interventions for a shipment.
    Generates real interventions using Tower 1 XGBoost model.
    """
    from app.services.dice_service import generate_dice_for_shipment
    return generate_dice_for_shipment(shipment_id, horizon_hours=horizon)


@router.get("/{shipment_id}/kimi")
async def get_kimi(shipment_id: str, horizon: int = 48):
    """
    Return Kimi K2.5 AI recommendation for a shipment.
    Generates AI-driven recommendations using Tower 1 + Tower 2 features.
    """
    from app.services.kimi_service import generate_kimi_for_shipment
    return generate_kimi_for_shipment(shipment_id, horizon_hours=horizon)
