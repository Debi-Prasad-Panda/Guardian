"""
Guardian — Analytics Data Models
Pydantic schemas for KPIs, model performance, and dashboard overview.
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class KPI(BaseModel):
    label: str
    value: str
    change: str = ""
    trend: str = "up"


class ModelMetrics(BaseModel):
    auc_roc: float = 0.0
    f1_score: float = 0.0
    accuracy: float = 0.0
    precision_val: float = 0.0
    recall: float = 0.0
    training_rows: str = ""
    model_version: str = ""


class SavingsTrend(BaseModel):
    month: str
    savings: float
    interventions: int


class CarrierBenchmark(BaseModel):
    carrier: str
    reliability: float
    acceptance_rate: float
    current_load: float
    avg_delay_hrs: float


class RiskDistribution(BaseModel):
    label: str
    count: int
    percentage: float


class AnalyticsSummary(BaseModel):
    kpis: List[KPI] = []
    model_metrics: Optional[ModelMetrics] = None
    savings_trend: List[SavingsTrend] = []
    carrier_benchmarks: List[CarrierBenchmark] = []
    risk_distribution: List[RiskDistribution] = []
    top_risk_routes: List[Dict[str, Any]] = []


class DashboardAlert(BaseModel):
    id: str
    type: str
    message: str
    severity: str = "medium"
    timestamp: str = ""
    shipment_id: str = ""


class InterventionSummary(BaseModel):
    total: int = 0
    accepted: int = 0
    overridden: int = 0
    pending: int = 0
    total_savings: str = "₹0"


class DashboardOverview(BaseModel):
    kpis: List[KPI] = []
    alerts: List[DashboardAlert] = []
    intervention_summary: Optional[InterventionSummary] = None
    risk_heatmap: List[Dict[str, Any]] = []
    recent_shipments: List[Dict[str, Any]] = []
