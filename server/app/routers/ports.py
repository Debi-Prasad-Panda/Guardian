"""
Guardian — Ports Router
Port congestion, vessel tracking, and demurrage endpoints, backed by MongoDB.
"""
from fastapi import APIRouter
from app.services import port_service

router = APIRouter(prefix="/api/ports", tags=["ports"])


@router.get("/")
async def get_ports():
    """Return all ports with congestion data."""
    ports = await port_service.get_all_ports()
    return ports


@router.get("/vessels")
async def get_vessels():
    """Return all tracked vessels."""
    vessels = await port_service.get_all_vessels()
    return vessels


@router.get("/kpis")
async def get_port_kpis():
    """Return aggregated port KPIs."""
    kpis = await port_service.get_port_kpis()
    return kpis
