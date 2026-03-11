"""
Guardian — Port Service
Handles port congestion, vessel, and demurrage data from MongoDB.
"""
from app.database import get_db
from typing import List, Dict, Any


async def get_all_ports() -> List[Dict[str, Any]]:
    """Fetch all ports from MongoDB."""
    db = get_db()
    cursor = db.ports.find({}, {"_id": 0})
    return await cursor.to_list(length=50)


async def get_all_vessels() -> List[Dict[str, Any]]:
    """Fetch all vessels from MongoDB."""
    db = get_db()
    cursor = db.vessels.find({}, {"_id": 0})
    return await cursor.to_list(length=50)


async def get_port_kpis() -> Dict[str, Any]:
    """Compute port-level KPIs from MongoDB."""
    db = get_db()
    ports = await get_all_ports()
    vessels = await get_all_vessels()

    critical = sum(1 for p in ports if p.get("congestion_index", 0) >= 7.0)
    avg_congestion = (
        sum(p.get("congestion_index", 0) for p in ports) / max(len(ports), 1)
    )
    total_demurrage = sum(p.get("demurrage_risk", 0) for p in ports)

    return {
        "critical_ports": critical,
        "avg_congestion": round(float(avg_congestion), 1),
        "total_vessels": len(vessels),
        "total_demurrage_risk": f"₹{total_demurrage / 100000:.1f}L" if total_demurrage >= 100000 else f"₹{int(total_demurrage):,}"
    }
