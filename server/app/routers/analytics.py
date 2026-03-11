from fastapi import APIRouter

router = APIRouter()

@router.get("/summary")
def get_analytics_summary():
    return {
        "kpis": {
            "total_saved": 1245000,
            "saved_trend": 23,
            "interventions": 47,
            "intervention_rate": 78,
            "monitored": 1247,
            "avg_accuracy": 84.1
        },
        "model_performance": {
            "auc": 0.841,
            "f1": 0.89,
            "precision": 0.91,
            "recall": 0.87,
            "training_rows": "1.18M",
            "conformal_coverage": 90
        }
    }
