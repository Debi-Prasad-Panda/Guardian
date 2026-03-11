from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_shipments():
    return [{"id": "SHP_001", "route": "BLR -> DEL", "tier": "CRITICAL", "risk_score": 87}]

@router.get("/{shipment_id}")
def get_shipment(shipment_id: str):
    return {"id": shipment_id, "route": "BLR -> DEL"}

@router.get("/{shipment_id}/shap")
def get_shap(shipment_id: str):
    return {"features": [{"name": "weather_severity_index", "value": 15.2, "type": "positive"}]}

@router.get("/{shipment_id}/timeline")
def get_timeline(shipment_id: str):
    return {"t24": 31, "t48": 68, "t72": 87}

@router.post("/{shipment_id}/intervention")
def get_intervention(shipment_id: str):
    return {"recommendation": "Assign FedEx-2", "cost": 12000, "saving": 68000}

@router.post("/{shipment_id}/override")
def override_intervention(shipment_id: str):
    return {"status": "success"}
