"""
Guardian — Port Data Models
Pydantic schemas for port congestion, vessels, and demurrage.
"""
from pydantic import BaseModel
from typing import Optional, List


class Vessel(BaseModel):
    id: str
    name: str
    status: str = "Anchored"
    port: str = ""
    eta: str = ""
    cargo_type: str = "Container"
    flag: str = "IN"


class Port(BaseModel):
    id: str
    name: str
    region: str = ""
    congestion_index: float = 0.0
    congestion_label: str = "Low"
    predicted_delay_hrs: float = 0.0
    demurrage_risk: float = 0.0
    demurrage_cost_est: str = "—"
    vessels_at_port: int = 0
    status: str = "Normal"
    trend: str = "stable"
    wait_time_hrs: float = 0.0


class PortKPIs(BaseModel):
    critical_ports: int = 0
    avg_congestion: float = 0.0
    total_vessels: int = 0
    total_demurrage_risk: str = "₹0"
