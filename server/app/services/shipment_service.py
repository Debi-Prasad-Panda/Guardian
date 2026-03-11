"""
Guardian — Shipment Service
Handles all shipment-related data operations against MongoDB.
"""
from app.database import get_db
from typing import Optional, List, Dict, Any


async def get_all_shipments() -> List[Dict[str, Any]]:
    """Fetch all shipments from MongoDB."""
    db = get_db()
    cursor = db.shipments.find({}, {"_id": 0})
    return await cursor.to_list(length=100)


async def get_shipment_by_id(shipment_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single shipment by its ID."""
    db = get_db()
    return await db.shipments.find_one({"id": shipment_id}, {"_id": 0})


async def get_shipment_detail(shipment_id: str) -> Optional[Dict[str, Any]]:
    """Fetch full shipment detail including SHAP, timeline, DiCE, etc."""
    db = get_db()
    detail = await db.shipment_details.find_one({"shipment_id": shipment_id}, {"_id": 0})
    if not detail:
        # If no separate detail doc, build from shipment
        shipment = await get_shipment_by_id(shipment_id)
        if shipment:
            return {
                "shipment": shipment,
                "shap_values": [],
                "timeline": [],
                "horizon_risks": [],
                "dice_interventions": [],
                "kimi_recommendation": None,
                "history": []
            }
        return None
    return detail


async def get_shipment_shap(shipment_id: str) -> Optional[Dict[str, Any]]:
    """Fetch SHAP values for a shipment."""
    db = get_db()
    detail = await db.shipment_details.find_one(
        {"shipment_id": shipment_id},
        {"_id": 0, "shap_values": 1}
    )
    if detail:
        return {"shap_values": detail.get("shap_values", [])}
    return None


async def get_shipment_timeline(shipment_id: str) -> Optional[Dict[str, Any]]:
    """Fetch timeline checkpoints for a shipment."""
    db = get_db()
    detail = await db.shipment_details.find_one(
        {"shipment_id": shipment_id},
        {"_id": 0, "timeline": 1, "horizon_risks": 1}
    )
    if detail:
        return {
            "timeline": detail.get("timeline", []),
            "horizon_risks": detail.get("horizon_risks", [])
        }
    return None


async def get_shipment_dice(shipment_id: str) -> Optional[Dict[str, Any]]:
    """Fetch DiCE interventions for a shipment."""
    db = get_db()
    detail = await db.shipment_details.find_one(
        {"shipment_id": shipment_id},
        {"_id": 0, "dice_interventions": 1}
    )
    if detail:
        return {"dice_interventions": detail.get("dice_interventions", [])}
    return None


async def get_shipment_kimi(shipment_id: str) -> Optional[Dict[str, Any]]:
    """Fetch Kimi AI recommendation for a shipment."""
    db = get_db()
    detail = await db.shipment_details.find_one(
        {"shipment_id": shipment_id},
        {"_id": 0, "kimi_recommendation": 1}
    )
    if detail:
        return {"kimi_recommendation": detail.get("kimi_recommendation")}
    return None


async def get_network_graph() -> Dict[str, Any]:
    """Fetch or build the risk propagation network graph."""
    db = get_db()
    graph = await db.network_graph.find_one({}, {"_id": 0})
    if graph:
        return graph

    # Build from shipment connections
    shipments = await get_all_shipments()
    nodes = []
    edges = []
    for s in shipments:
        nodes.append({
            "id": s["id"],
            "risk": s.get("risk", 0),
            "label": f"{s['origin']}→{s['destination']}",
            "type": "shipment"
        })

    # Create edges for shared carriers
    carrier_groups: Dict[str, List[str]] = {}
    for s in shipments:
        carrier = s.get("carrier", "")
        if carrier:
            carrier_groups.setdefault(carrier, []).append(s["id"])

    for carrier, ids in carrier_groups.items():
        id_list: List[str] = ids
        for i, src in enumerate(id_list):
            for tgt in id_list[i + 1:]:
                edges.append({
                    "source": src,
                    "target": tgt,
                    "weight": 0.6,
                    "relationship": "same_carrier"
                })

    return {"nodes": nodes, "edges": edges}
