from fastapi import APIRouter, Body

router = APIRouter()

@router.post("/inject")
def inject_chaos(params: dict = Body(...)):
    return {"affected_count": 47, "interventions": 12, "savings": 845000}

@router.get("/presets")
def get_presets():
    return [{"id": "suez", "name": "Suez Canal Blockage (2021)"}]
