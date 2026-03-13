"""
Guardian — Database Seeder
Populates MongoDB with realistic Indian logistics data for demo.
Run: cd server && python -m app.seed

At seed time, if the three-tower ML pipeline is available, each shipment's
risk/uncertainty values are computed by the real model rather than using
hard-coded values.  Falls back silently to the hard-coded values if models
are not yet loaded.
"""
import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from app.config import settings

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
#  SHIPMENT DATA — 8 shipments with Indian city coordinates
# ──────────────────────────────────────────────────────────────
SHIPMENTS = [
    {
        "id": "SHP_001",
        "origin": "Singapore",
        "destination": "Mumbai JNPT",
        "status": "In Transit",
        "risk": 0.87,
        "risk_label": "Critical",
        "carrier": "Maersk Line",
        "mode": "Sea",
        "service_tier": "Critical",
        "weight": 245000.0,
        "value": 1250000.0,
        "eta": "2026-03-20T14:00:00",
        "progress": 0.45,
        "origin_coords": {"lat": 1.2640, "lng": 103.8400},
        "dest_coords": {"lat": 18.9520, "lng": 72.9481},
        "current_coords": {"lat": 5.9, "lng": 80.5},
        "alert_text": "Severe weather warning: Cyclone forming in the Arabian Sea",
        "prediction_horizon": 48,
        "mc_dropout_mean": 0.87,
        "mc_dropout_std": 0.05,
        "conformal_lower": 0.78,
        "conformal_upper": 0.94
    },
    {
        "id": "SHP_002",
        "origin": "Rotterdam",
        "destination": "Chennai Port",
        "status": "In Transit",
        "risk": 0.68,
        "risk_label": "High",
        "carrier": "MSC",
        "mode": "Sea",
        "service_tier": "Priority",
        "weight": 180000.0,
        "value": 890000.0,
        "eta": "2026-04-05T08:00:00",
        "progress": 0.30,
        "origin_coords": {"lat": 51.9225, "lng": 4.4791},
        "dest_coords": {"lat": 13.0827, "lng": 80.2707},
        "current_coords": {"lat": 35.8, "lng": 14.5},
        "alert_text": "Suez Canal congestion delaying transit by 3 days",
        "prediction_horizon": 48,
        "mc_dropout_mean": 0.68,
        "mc_dropout_std": 0.12,
        "conformal_lower": 0.55,
        "conformal_upper": 0.81
    },
    {
        "id": "SHP_003",
        "origin": "Dubai Jebel Ali",
        "destination": "Kandla Port",
        "status": "In Transit",
        "risk": 0.31,
        "risk_label": "Medium",
        "carrier": "CMA CGM",
        "mode": "Sea",
        "service_tier": "Standard",
        "weight": 95000.0,
        "value": 420000.0,
        "eta": "2026-03-15T18:00:00",
        "progress": 0.72,
        "origin_coords": {"lat": 24.9857, "lng": 55.0273},
        "dest_coords": {"lat": 23.0225, "lng": 70.2167},
        "current_coords": {"lat": 24.0, "lng": 60.5},
        "alert_text": "",
        "prediction_horizon": 24,
        "mc_dropout_mean": 0.31,
        "mc_dropout_std": 0.08,
        "conformal_lower": 0.22,
        "conformal_upper": 0.42
    },
    {
        "id": "SHP_004",
        "origin": "Colombo",
        "destination": "Tuticorin Port",
        "status": "Delivered",
        "risk": 0.12,
        "risk_label": "Low",
        "carrier": "Hapag-Lloyd",
        "mode": "Sea",
        "service_tier": "Standard",
        "weight": 65000.0,
        "value": 180000.0,
        "eta": "2026-03-11T10:00:00",
        "progress": 1.0,
        "origin_coords": {"lat": 6.9497, "lng": 79.8422},
        "dest_coords": {"lat": 8.7642, "lng": 78.1348},
        "current_coords": {"lat": 8.7642, "lng": 78.1348},
        "alert_text": "",
        "prediction_horizon": 72,
        "mc_dropout_mean": 0.12,
        "mc_dropout_std": 0.04,
        "conformal_lower": 0.06,
        "conformal_upper": 0.20
    },
    {
        "id": "SHP_005",
        "origin": "Los Angeles",
        "destination": "Visakhapatnam Port",
        "status": "In Transit",
        "risk": 0.45,
        "risk_label": "Medium",
        "carrier": "ONE",
        "mode": "Sea",
        "service_tier": "Priority",
        "weight": 120000.0,
        "value": 560000.0,
        "eta": "2026-04-12T06:00:00",
        "progress": 0.55,
        "origin_coords": {"lat": 33.7445, "lng": -118.2690},
        "dest_coords": {"lat": 17.6868, "lng": 83.2185},
        "current_coords": {"lat": 1.5, "lng": 130.0},
        "alert_text": "Port of LA departure delayed due to labor shortages",
        "prediction_horizon": 48,
        "mc_dropout_mean": 0.45,
        "mc_dropout_std": 0.15,
        "conformal_lower": 0.32,
        "conformal_upper": 0.60
    },
    {
        "id": "SHP_006",
        "origin": "Shanghai",
        "destination": "Mumbai JNPT",
        "status": "Delayed",
        "risk": 0.78,
        "risk_label": "High",
        "carrier": "COSCO",
        "mode": "Sea",
        "service_tier": "Critical",
        "weight": 520000.0,
        "value": 2800000.0,
        "eta": "2026-03-25T20:00:00",
        "progress": 0.25,
        "origin_coords": {"lat": 31.3536, "lng": 121.5794},
        "dest_coords": {"lat": 18.9520, "lng": 72.9481},
        "current_coords": {"lat": 15.0, "lng": 110.0},
        "alert_text": "Typhoon warning in South China Sea causing rerouting",
        "prediction_horizon": 72,
        "mc_dropout_mean": 0.78,
        "mc_dropout_std": 0.07,
        "conformal_lower": 0.68,
        "conformal_upper": 0.88
    },
    {
        "id": "SHP_007",
        "origin": "Hamburg",
        "destination": "Kolkata Port",
        "status": "In Transit",
        "risk": 0.22,
        "risk_label": "Low",
        "carrier": "Evergreen",
        "mode": "Sea",
        "service_tier": "Standard",
        "weight": 78000.0,
        "value": 320000.0,
        "eta": "2026-04-08T22:00:00",
        "progress": 0.65,
        "origin_coords": {"lat": 53.5411, "lng": 9.9839},
        "dest_coords": {"lat": 22.5726, "lng": 88.3639},
        "current_coords": {"lat": -10.0, "lng": 60.0},
        "alert_text": "",
        "prediction_horizon": 24,
        "mc_dropout_mean": 0.22,
        "mc_dropout_std": 0.06,
        "conformal_lower": 0.14,
        "conformal_upper": 0.32
    },
    {
        "id": "SHP_008",
        "origin": "Shenzhen",
        "destination": "Chennai Port",
        "status": "In Transit",
        "risk": 0.55,
        "risk_label": "Medium",
        "carrier": "OOCL",
        "mode": "Sea",
        "service_tier": "Critical",
        "weight": 32000.0,
        "value": 4500000.0,
        "eta": "2026-03-18T08:00:00",
        "progress": 0.80,
        "origin_coords": {"lat": 22.5028, "lng": 113.8824},
        "dest_coords": {"lat": 13.0827, "lng": 80.2707},
        "current_coords": {"lat": 5.0, "lng": 95.0},
        "alert_text": "Malacca Strait congestion increasing wait times",
        "prediction_horizon": 24,
        "mc_dropout_mean": 0.55,
        "conformal_lower": 0.42,
        "conformal_upper": 0.68
    }
]


# ──────────────────────────────────────────────────────────────
#  SHIPMENT DETAILS — SHAP, timeline, DiCE, Kimi per shipment
# ──────────────────────────────────────────────────────────────
SHIPMENT_DETAILS = [
    {
        "shipment_id": "SHP_001",
        "shap_values": [
            {"feature": "weather_severity_index", "value": 8.5, "impact": 0.228, "direction": "positive"},
            {"feature": "port_wait_times", "value": 18.0, "impact": 0.324, "direction": "positive"},
            {"feature": "carrier_reliability", "value": 0.88, "impact": -0.148, "direction": "negative"},
            {"feature": "route_delay_rate", "value": 0.35, "impact": 0.165, "direction": "positive"},
            {"feature": "prediction_horizon_hours", "value": 48, "impact": 0.085, "direction": "positive"},
            {"feature": "service_tier_encoded", "value": 2, "impact": 0.065, "direction": "positive"},
        ],
        "timeline": [
            {"checkpoint": "Origin Port", "location": "Singapore (SGSIN)", "time": "2026-03-10T08:00:00", "status": "completed", "risk": 0.12, "details": "Container loaded on vessel MV Sagarmala"},
            {"checkpoint": "Malacca Strait", "location": "Indonesia / Malaysia", "time": "2026-03-12T18:00:00", "status": "completed", "risk": 0.31, "details": "High traffic volume in strait slowdown"},
            {"checkpoint": "Sea Transit", "location": "Arabian Sea", "time": "2026-03-14T06:00:00", "status": "current", "risk": 0.67, "details": "Cyclonic activity detected in Northern Arabian Sea"},
            {"checkpoint": "Port Approach", "location": "Mumbai Approach", "time": "2026-03-18T00:00:00", "status": "upcoming", "risk": 0.82, "details": "Predicted: Severe port congestion delay"},
            {"checkpoint": "Final Unload", "location": "Mumbai JNPT", "time": "2026-03-20T14:00:00", "status": "upcoming", "risk": 0.87, "details": "Predicted: SLA at risk — high demurrage risk"},
        ],
        "horizon_risks": [
            {"horizon": 24, "risk": 0.67, "label": "High"},
            {"horizon": 48, "risk": 0.87, "label": "Critical"},
            {"horizon": 72, "risk": 0.92, "label": "Critical"}
        ],
        "dice_interventions": [
            {
                "option": "Divert to Mundra Port",
                "changed_features": {"port_wait_times": 4.0, "weather_severity_index": 3.0},
                "original_risk": 0.87,
                "new_risk": 0.34,
                "cost": 85000,
                "co2_delta_kg": 450.0,
                "feasibility": "High"
            },
            {
                "option": "Slow Steaming (Save Fuel)",
                "changed_features": {"weather_severity_index": 2.0},
                "original_risk": 0.87,
                "new_risk": 0.72,
                "cost": -12000,
                "co2_delta_kg": -1200.0,
                "feasibility": "High"
            }
        ],
        "kimi_recommendation": {
            "action": "Divert to Mundra Port",
            "justification": "Mumbai JNPT is facing extreme congestion (18hr wait). Diverting to Mundra avoids the primary weather cell in the South Arabian Sea and reduces port wait to 4hrs. Inter-modal rail from Mundra to Mumbai adds 12hrs but ensures SLA safety.",
            "cost_of_action": 85000,
            "cost_of_sla_miss": 250000,
            "net_saving": 165000,
            "co2_delta_kg": 450.0,
            "confidence": "High"
        },
        "history": [
            {"event": "Created", "time": "2026-03-10T06:00:00", "detail": "Shipment booked: Singapore→Mumbai, Critical ocean tier"},
            {"event": "Loaded", "time": "2026-03-10T08:00:00", "detail": "Loaded at PSA Singapore Terminal 1"},
            {"event": "Weather Alert", "time": "2026-03-12T14:00:00", "detail": "Cyclone forming in Arabian Sea (8.5 Sev)"},
            {"event": "Risk Escalation", "time": "2026-03-14T06:00:00", "detail": "Risk increased to 67% due to cyclonic path"},
        ]
    },
    {
        "shipment_id": "SHP_002",
        "shap_values": [
            {"feature": "labor_strike_probability", "value": 0.88, "impact": 0.285, "direction": "positive"},
            {"feature": "port_wait_times", "value": 12.0, "impact": 0.195, "direction": "positive"},
            {"feature": "carrier_reliability", "value": 0.78, "impact": 0.045, "direction": "positive"},
        ],
        "timeline": [
            {"checkpoint": "Origin Port", "location": "Rotterdam (NLRTM)", "time": "2026-03-11T06:00:00", "status": "completed", "risk": 0.22, "details": "Vessel departed Rotterdam Delta terminal"},
            {"checkpoint": "Suez Canal", "location": "Egypt", "time": "2026-03-18T16:00:00", "status": "current", "risk": 0.48, "details": "Suez congestion detected (Transit delay 72hr)"},
            {"checkpoint": "Red Sea Transit", "location": "Red Sea", "time": "2026-03-24T04:00:00", "status": "upcoming", "risk": 0.62, "details": "Regional risk elevated — security escort required"},
            {"checkpoint": "Final Destination", "location": "Chennai Port", "time": "2026-04-05T08:00:00", "status": "upcoming", "risk": 0.68, "details": "Predicted delay due to Suez backlog"},
        ],
        "horizon_risks": [
            {"horizon": 24, "risk": 0.48, "label": "Medium"},
            {"horizon": 48, "risk": 0.68, "label": "High"},
            {"horizon": 72, "risk": 0.72, "label": "High"}
        ],
        "dice_interventions": [
            {
                "option": "Reroute Cape of Good Hope",
                "changed_features": {"labor_strike_probability": 0.05, "route_delay_rate": 0.45},
                "original_risk": 0.68,
                "new_risk": 0.42,
                "cost": 150000,
                "co2_delta_kg": 8500.0,
                "feasibility": "High"
            }
        ],
        "kimi_recommendation": {
            "action": "Maintain Course + High Priority Berth",
            "justification": "Suez delay is unavoidable but Cape of Good Hope adds 12 days and ₹1.5L cost. Paying for priority berthing at Chennai (₹25K) recovers 36hrs.",
            "cost_of_action": 25000,
            "cost_of_sla_miss": 180000,
            "net_saving": 155000,
            "co2_delta_kg": 0,
            "confidence": "Medium"
        },
        "history": [
            {"event": "Created", "time": "2026-03-10T22:00:00", "detail": "Ocean shipment: Rotterdam→Chennai, Priority tier"},
            {"event": "Congestion Alert", "time": "2026-03-18T04:00:00", "detail": "Ever Given class vessel grounding at Suez Canal portal"},
        ]
    }
]


# ──────────────────────────────────────────────────────────────
#  PORT DATA — Major Indian ports
# ──────────────────────────────────────────────────────────────
PORTS = [
    {"id": "PRT_001", "name": "Mumbai JNPT", "region": "India West", "congestion_index": 8.2, "congestion_label": "Critical",
     "predicted_delay_hrs": 18, "demurrage_risk": 210000, "demurrage_cost_est": "₹2.1L", "vessels_at_port": 12,
     "status": "Congested", "trend": "rising", "wait_time_hrs": 18},
    {"id": "PRT_002", "name": "Chennai Port", "region": "India South", "congestion_index": 4.1, "congestion_label": "Medium",
     "predicted_delay_hrs": 3, "demurrage_risk": 28000, "demurrage_cost_est": "₹28K", "vessels_at_port": 6,
     "status": "Normal", "trend": "stable", "wait_time_hrs": 3},
    {"id": "PRT_003", "name": "Singapore", "region": "Southeast Asia", "congestion_index": 2.0, "congestion_label": "Low",
     "predicted_delay_hrs": 0, "demurrage_risk": 0, "demurrage_cost_est": "—", "vessels_at_port": 28,
     "status": "Normal", "trend": "stable", "wait_time_hrs": 0},
    {"id": "PRT_004", "name": "Rotterdam", "region": "Europe", "congestion_index": 6.7, "congestion_label": "High",
     "predicted_delay_hrs": 9, "demurrage_risk": 75000, "demurrage_cost_est": "₹75K", "vessels_at_port": 18,
     "status": "Delayed", "trend": "rising", "wait_time_hrs": 9},
    {"id": "PRT_005", "name": "Dubai Jebel Ali", "region": "Middle East", "congestion_index": 3.5, "congestion_label": "Low",
     "predicted_delay_hrs": 2, "demurrage_risk": 15000, "demurrage_cost_est": "₹15K", "vessels_at_port": 14,
     "status": "Normal", "trend": "falling", "wait_time_hrs": 2},
    {"id": "PRT_006", "name": "Shanghai", "region": "East Asia", "congestion_index": 5.4, "congestion_label": "Medium",
     "predicted_delay_hrs": 5, "demurrage_risk": 42000, "demurrage_cost_est": "₹42K", "vessels_at_port": 35,
     "status": "Moderate", "trend": "stable", "wait_time_hrs": 5},
    {"id": "PRT_007", "name": "Los Angeles", "region": "North America", "congestion_index": 7.8, "congestion_label": "High",
     "predicted_delay_hrs": 14, "demurrage_risk": 180000, "demurrage_cost_est": "₹1.8L", "vessels_at_port": 22,
     "status": "Congested", "trend": "rising", "wait_time_hrs": 14},
]

VESSELS = [
    {"id": "VSL_001", "name": "MV Sagarmala", "status": "In Transit", "port": "Mumbai JNPT", "eta": "2026-03-15T06:00:00", "cargo_type": "Container", "flag": "IN"},
    {"id": "VSL_002", "name": "Maersk Eindhoven", "status": "In Transit", "port": "Chennai Port", "eta": "2026-03-14T08:00:00", "cargo_type": "Container", "flag": "DK"},
    {"id": "VSL_003", "name": "MSC Oscar", "status": "Loading", "port": "Singapore", "eta": "2026-03-11T22:00:00", "cargo_type": "Mixed", "flag": "PA"},
    {"id": "VSL_004", "name": "Ever Given", "status": "Anchored", "port": "Rotterdam", "eta": "2026-03-12T14:00:00", "cargo_type": "Bulk", "flag": "TW"},
    {"id": "VSL_005", "name": "OOCL Hong Kong", "status": "In Transit", "port": "Shanghai", "eta": "2026-03-18T12:00:00", "cargo_type": "Mixed", "flag": "HK"},
]

# ──────────────────────────────────────────────────────────────
#  NETWORK GRAPH — Risk propagation connections
# ──────────────────────────────────────────────────────────────
NETWORK_GRAPH = {
    "nodes": [
        {"id": "SHP_001", "risk": 0.87, "label": "Singapore→Mumbai", "type": "shipment"},
        {"id": "SHP_002", "risk": 0.68, "label": "Rotterdam→Chennai", "type": "shipment"},
        {"id": "SHP_003", "risk": 0.31, "label": "Dubai→Kandla", "type": "shipment"},
        {"id": "SHP_004", "risk": 0.12, "label": "Colombo→Tuticorin", "type": "shipment"},
        {"id": "SHP_005", "risk": 0.45, "label": "LA→Visakhapatnam", "type": "shipment"},
        {"id": "SHP_006", "risk": 0.78, "label": "Shanghai→Mumbai", "type": "shipment"},
        {"id": "SHP_007", "risk": 0.22, "label": "Hamburg→Kolkata", "type": "shipment"},
        {"id": "SHP_008", "risk": 0.55, "label": "Shenzhen→Chennai", "type": "shipment"},
        {"id": "HUB_MUM", "risk": 0.72, "label": "Mumbai Hub", "type": "hub"},
        {"id": "HUB_SIN", "risk": 0.45, "label": "Singapore Hub", "type": "hub"},
        {"id": "HUB_CHN", "risk": 0.55, "label": "Chennai Hub", "type": "hub"},
    ],
    "edges": [
        {"source": "SHP_001", "target": "SHP_006", "weight": 0.7, "relationship": "same_destination"},
        {"source": "SHP_001", "target": "HUB_MUM", "weight": 0.8, "relationship": "same_destination"},
        {"source": "SHP_006", "target": "HUB_MUM", "weight": 0.8, "relationship": "same_destination"},
        {"source": "SHP_008", "target": "HUB_SIN", "weight": 0.6, "relationship": "corridor"},
        {"source": "SHP_004", "target": "HUB_SIN", "weight": 0.6, "relationship": "corridor"},
        {"source": "SHP_003", "target": "SHP_007", "weight": 0.5, "relationship": "same_carrier"},
        {"source": "SHP_002", "target": "HUB_CHN", "weight": 0.7, "relationship": "same_destination"},
        {"source": "SHP_008", "target": "HUB_CHN", "weight": 0.7, "relationship": "same_destination"},
        {"source": "SHP_001", "target": "HUB_SIN", "weight": 0.4, "relationship": "same_origin"},
        {"source": "HUB_MUM", "target": "HUB_SIN", "weight": 0.5, "relationship": "corridor"},
        {"source": "HUB_MUM", "target": "HUB_CHN", "weight": 0.5, "relationship": "corridor"},
    ]
}

# ──────────────────────────────────────────────────────────────
#  SETTINGS — Default configuration
# ──────────────────────────────────────────────────────────────
DEFAULT_SETTINGS = {
    "type": "user_settings",
    "risk_threshold": 0.65,
    "kimi_api_key": "",
    "mapbox_token": "",
    "backend_url": "http://localhost:8000",
    "gemini_api_key": "",
    "model_confidence_threshold": 0.5,
    "notifications": {
        "email_alerts": True,
        "risk_threshold_alerts": True,
        "intervention_alerts": True,
        "weekly_digest": False
    }
}


async def seed():
    """Run the full database seed."""
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB]

    print(f"Seeding database: {settings.MONGODB_DB}...")

    # Clear existing data
    for collection in ["shipments", "shipment_details", "ports", "vessels",
                       "network_graph", "analytics", "settings"]:
        await db[collection].drop()
        print(f"   Cleared: {collection}")

    # ── Enrich SHIPMENTS with real ML risk scores (best-effort) ──────────────
    enriched_shipments = []
    try:
        from app.services.fusion_service import predict_full_pipeline
        print("   Computing ML risk scores for shipments...")
        for s in SHIPMENTS:
            try:
                ml = predict_full_pipeline(s, horizon_hours=48)
                enriched = dict(s)
                enriched["risk"]            = round(ml["risk_score"], 4)
                enriched["mc_dropout_mean"] = round(ml["risk_score"], 4)
                enriched["mc_dropout_std"]  = round(ml["uncertainty"], 4)
                enriched["conformal_lower"] = round(ml["interval_low"], 4)
                enriched["conformal_upper"] = round(ml["interval_high"], 4)
                # Update risk_label to match computed score
                r = ml["risk_score"]
                if r >= 0.80:
                    enriched["risk_label"] = "Critical"
                elif r >= 0.60:
                    enriched["risk_label"] = "High"
                elif r >= 0.35:
                    enriched["risk_label"] = "Medium"
                else:
                    enriched["risk_label"] = "Low"
                enriched_shipments.append(enriched)
                print(f"      {s['id']}: risk={enriched['risk']} ({enriched['risk_label']})")
            except Exception as exc:
                logger.warning("ML enrichment failed for %s: %s — using hardcoded value", s.get("id"), exc)
                enriched_shipments.append(s)
        print("   ML enrichment complete")
    except Exception as exc:
        logger.warning("ML pipeline unavailable at seed time: %s — using hardcoded values", exc)
        enriched_shipments = list(SHIPMENTS)

    # Insert shipments
    await db.shipments.insert_many(enriched_shipments)
    print(f"   Inserted {len(enriched_shipments)} shipments")

    # Insert shipment details
    if SHIPMENT_DETAILS:
        await db.shipment_details.insert_many(SHIPMENT_DETAILS)
        print(f"   Inserted {len(SHIPMENT_DETAILS)} shipment details")

    # Insert ports
    await db.ports.insert_many(PORTS)
    print(f"   Inserted {len(PORTS)} ports")

    # Insert vessels
    await db.vessels.insert_many(VESSELS)
    print(f"   Inserted {len(VESSELS)} vessels")

    # Insert network graph
    await db.network_graph.insert_one(NETWORK_GRAPH)
    print(f"   Inserted network graph ({len(NETWORK_GRAPH['nodes'])} nodes, {len(NETWORK_GRAPH['edges'])} edges)")

    # Insert default settings
    await db.settings.insert_one(DEFAULT_SETTINGS)
    print(f"   Inserted default settings")

    # Create indexes
    await db.shipments.create_index("id", unique=True)
    await db.shipment_details.create_index("shipment_id", unique=True)
    await db.ports.create_index("id", unique=True)
    await db.vessels.create_index("id", unique=True)
    print(f"   Created indexes")

    print(f"\nDatabase seeded successfully!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
