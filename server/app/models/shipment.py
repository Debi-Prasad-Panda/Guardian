"""
Guardian — Shipment Data Models
Pydantic schemas for shipment data, SHAP, DiCE, timeline, and graph.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class Coords(BaseModel):
    lat: float
    lng: float


class Shipment(BaseModel):
    """Core shipment for list view and map."""
    id: str
    origin: str
    destination: str
    status: str = "In Transit"
    risk: float = 0.0
    risk_label: str = "Low"
    carrier: str = ""
    mode: str = "Road"
    service_tier: str = "Standard"
    weight: float = 0.0
    value: float = 0.0
    eta: str = ""
    progress: float = 0.0
    origin_coords: Optional[Coords] = None
    dest_coords: Optional[Coords] = None
    current_coords: Optional[Coords] = None
    alert_text: str = ""
    prediction_horizon: int = 48
    mc_dropout_mean: Optional[float] = None
    mc_dropout_std: Optional[float] = None
    conformal_lower: Optional[float] = None
    conformal_upper: Optional[float] = None

    class Config:
        extra = "allow"


class SHAPFeature(BaseModel):
    feature: str
    value: float
    impact: float
    direction: str = "positive"


class TimelineCheckpoint(BaseModel):
    checkpoint: str
    location: str
    time: str
    status: str = "completed"
    risk: Optional[float] = None
    details: str = ""


class HorizonRisk(BaseModel):
    horizon: int
    risk: float
    label: str


class DiCEOption(BaseModel):
    option: str
    changed_features: Dict[str, Any] = {}
    original_risk: float = 0.0
    new_risk: float = 0.0
    cost: float = 0.0
    co2_delta_kg: float = 0.0
    feasibility: str = "High"


class KimiRecommendation(BaseModel):
    action: str
    justification: str
    cost_of_action: float = 0.0
    cost_of_sla_miss: float = 0.0
    net_saving: float = 0.0
    co2_delta_kg: float = 0.0
    confidence: str = "High"


class ShipmentDetail(BaseModel):
    """Full shipment data for detail view."""
    shipment: Shipment
    shap_values: List[SHAPFeature] = []
    timeline: List[TimelineCheckpoint] = []
    horizon_risks: List[HorizonRisk] = []
    dice_interventions: List[DiCEOption] = []
    kimi_recommendation: Optional[KimiRecommendation] = None
    history: List[Dict[str, Any]] = []


class NetworkNode(BaseModel):
    id: str
    risk: float = 0.0
    label: str = ""
    type: str = "shipment"


class NetworkEdge(BaseModel):
    source: str
    target: str
    weight: float = 0.5
    relationship: str = "same_carrier"


class NetworkGraph(BaseModel):
    nodes: List[NetworkNode] = []
    edges: List[NetworkEdge] = []
