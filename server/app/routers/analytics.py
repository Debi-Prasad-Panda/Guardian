"""
Guardian Backend — Analytics + Dashboard Overview Router
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/summary")
def get_analytics_summary():
    return {
        "kpis": {
            "total_saved_inr": 1245000,
            "saved_trend_pct": 23,
            "interventions_count": 47,
            "intervention_acceptance_rate": 78,
            "shipments_monitored": 1247,
            "avg_accuracy_pct": 84.1,
        },
        "model_performance": {
            "auc_roc": 0.841,
            "f1_score": 0.89,
            "precision": 0.91,
            "recall": 0.87,
            "training_rows": "1.18M",
            "conformal_coverage_pct": 90,
            "mc_dropout_passes": 1000,
            "mapie_coverage": 0.90,
        },
        "savings_trend": [
            {"day": "Mon", "savings": 120000, "interventions": 8},
            {"day": "Tue", "savings": 98000,  "interventions": 6},
            {"day": "Wed", "savings": 145000, "interventions": 10},
            {"day": "Thu", "savings": 210000, "interventions": 14},
            {"day": "Fri", "savings": 178000, "interventions": 12},
            {"day": "Sat", "savings": 95000,  "interventions": 7},
            {"day": "Sun", "savings": 130000, "interventions": 9},
        ],
        "risk_distribution": [
            {"range": "0–20%",  "count": 312},
            {"range": "20–40%", "count": 487},
            {"range": "40–60%", "count": 254},
            {"range": "60–80%", "count": 118},
            {"range": "80–100%","count": 76},
        ],
        "carrier_benchmarks": [
            {"carrier": "Blue Dart", "reliability": 91, "avg_delay_h": 2.1, "interventions": 14, "saved_inr": 284000},
            {"carrier": "DHL",       "reliability": 88, "avg_delay_h": 3.4, "interventions": 11, "saved_inr": 241000},
            {"carrier": "FedEx IN",  "reliability": 85, "avg_delay_h": 4.1, "interventions": 9,  "saved_inr": 198000},
            {"carrier": "DTDC",      "reliability": 78, "avg_delay_h": 6.2, "interventions": 13, "saved_inr": 156000},
        ],
        "financial_roi": {
            "total_investment_inr": 186000,
            "total_savings_inr": 1245000,
            "roi_multiple": 6.7,
            "payback_days": 18,
            "co2_saved_kg": 2840,
            "monthly_breakdown": [
                {"month": "Jan", "investment": 28000, "savings": 168000},
                {"month": "Feb", "investment": 32000, "savings": 214000},
                {"month": "Mar", "investment": 41000, "savings": 287000},
            ]
        }
    }


@router.get("/overview")
def get_dashboard_overview():
    """KPI data for the Overview dashboard."""
    return {
        "kpi": {
            "active_alerts": 7,
            "shipments_at_risk": {"count": 3, "total": 8},
            "saved_today_inr": 84000,
            "saved_today_counter_start": 0,
            "model_confidence_auc": 0.841,
        },
        "recent_alerts": [
            {"id": "SHP_112", "route": "Chennai → Pune",    "risk": 92, "tier": "CRITICAL", "time": "2m ago",  "action": "Air Cargo Recommended"},
            {"id": "SHP_001", "route": "Bangalore → Delhi", "risk": 87, "tier": "CRITICAL", "time": "8m ago",  "action": "Re-route via Mumbai"},
            {"id": "SHP_214", "route": "Kolkata → Mumbai",  "risk": 65, "tier": "PRIORITY", "time": "23m ago", "action": "Expedite Current Carrier"},
            {"id": "SHP_451", "route": "Pune → Ahmedabad",  "risk": 58, "tier": "PRIORITY", "time": "41m ago", "action": "Monitor — Threshold 70%"},
        ],
        "horizon_heatmap": [
            {"id": "SHP_001", "route": "BLR→DEL", "t24": 82, "t48": 87, "t72": 91, "tier": "CRITICAL"},
            {"id": "SHP_112", "route": "MAA→PNQ", "t24": 88, "t48": 92, "t72": 95, "tier": "CRITICAL"},
            {"id": "SHP_214", "route": "CCU→BOM", "t24": 58, "t48": 65, "t72": 71, "tier": "PRIORITY"},
            {"id": "SHP_451", "route": "PNQ→AMD", "t24": 51, "t48": 58, "t72": 65, "tier": "PRIORITY"},
            {"id": "SHP_047", "route": "BOM→MAA", "t24": 45, "t48": 52, "t72": 60, "tier": "PRIORITY"},
            {"id": "SHP_093", "route": "DEL→CCU", "t24": 14, "t48": 18, "t72": 22, "tier": "STANDARD"},
        ],
        "top_interventions": [
            {"action": "SHP_112 → Air Cargo",         "savings_inr": 124000, "risk_reduction": 64, "status": "Pending"},
            {"action": "SHP_001 → Re-route Mumbai",   "savings_inr": 62400,  "risk_reduction": 46, "status": "Pending"},
            {"action": "SHP_214 → Expedite",          "savings_inr": 31200,  "risk_reduction": 28, "status": "Accepted"},
        ],
    }
