from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_ports():
    return [
        {"name": "Mumbai JNPT", "congestion_index": 8.2, "predicted_delay": "+18 hrs", "wait": 32, "demurrage": 210000, "status": "CRITICAL"},
        {"name": "Chennai", "congestion_index": 4.1, "predicted_delay": "+3 hrs", "wait": 12, "demurrage": 28000, "status": "WARNING"}
    ]
