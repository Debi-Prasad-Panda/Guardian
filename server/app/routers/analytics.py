"""
Guardian — Analytics Router
Dashboard overview and analytics summary endpoints, backed by MongoDB.
"""
from fastapi import APIRouter
from app.services import analytics_service

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get("/analytics/summary")
async def get_analytics_summary():
    """Return full analytics summary with KPIs, model metrics, trends, benchmarks."""
    return await analytics_service.get_analytics_summary()


@router.get("/dashboard/overview")
async def get_dashboard_overview():
    """Return dashboard overview with KPIs, alerts, interventions, heatmap."""
    return await analytics_service.get_dashboard_overview()


@router.get("/analytics/graph-summary")
async def get_graph_summary():
    """Return supply-chain graph stats: shipment count, connection count, high-risk node count."""
    return await analytics_service.get_graph_summary()
