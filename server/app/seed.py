"""
Guardian — Database Seeder
Populates MongoDB with realistic Indian logistics data for demo.
Run: cd server && python -m app.seed
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from app.config import settings


# ──────────────────────────────────────────────────────────────
#  SHIPMENT DATA — 8 shipments with Indian city coordinates
# ──────────────────────────────────────────────────────────────
SHIPMENTS = [
    {
        "id": "SHP_001",
        "origin": "Mumbai",
        "destination": "Delhi",
        "status": "In Transit",
        "risk": 0.87,
        "risk_label": "Critical",
        "carrier": "BlueDart",
        "mode": "Road",
        "service_tier": "Critical",
        "weight": 2450.0,
        "value": 1250000.0,
        "eta": "2026-03-13T14:00:00",
        "progress": 0.45,
        "origin_coords": {"lat": 19.076, "lng": 72.8777},
        "dest_coords": {"lat": 28.6139, "lng": 77.209},
        "current_coords": {"lat": 23.2599, "lng": 77.4126},
        "alert_text": "Severe weather warning: Heavy rainfall predicted along NH-48 corridor",
        "prediction_horizon": 48,
        "mc_dropout_mean": 0.87,
        "mc_dropout_std": 0.05,
        "conformal_lower": 0.78,
        "conformal_upper": 0.94
    },
    {
        "id": "SHP_002",
        "origin": "Chennai",
        "destination": "Kolkata",
        "status": "In Transit",
        "risk": 0.68,
        "risk_label": "High",
        "carrier": "DHL-4",
        "mode": "Road",
        "service_tier": "Priority",
        "weight": 1800.0,
        "value": 890000.0,
        "eta": "2026-03-14T08:00:00",
        "progress": 0.30,
        "origin_coords": {"lat": 13.0827, "lng": 80.2707},
        "dest_coords": {"lat": 22.5726, "lng": 88.3639},
        "current_coords": {"lat": 17.3850, "lng": 78.4867},
        "alert_text": "Port workers strike at Chennai, operations partially halted",
        "prediction_horizon": 48,
        "mc_dropout_mean": 0.68,
        "mc_dropout_std": 0.12,
        "conformal_lower": 0.55,
        "conformal_upper": 0.81
    },
    {
        "id": "SHP_003",
        "origin": "Bangalore",
        "destination": "Hyderabad",
        "status": "In Transit",
        "risk": 0.31,
        "risk_label": "Medium",
        "carrier": "FedEx-2",
        "mode": "Road",
        "service_tier": "Standard",
        "weight": 950.0,
        "value": 420000.0,
        "eta": "2026-03-12T18:00:00",
        "progress": 0.72,
        "origin_coords": {"lat": 12.9716, "lng": 77.5946},
        "dest_coords": {"lat": 17.385, "lng": 78.4867},
        "current_coords": {"lat": 15.3173, "lng": 75.7139},
        "alert_text": "",
        "prediction_horizon": 24,
        "mc_dropout_mean": 0.31,
        "mc_dropout_std": 0.08,
        "conformal_lower": 0.22,
        "conformal_upper": 0.42
    },
    {
        "id": "SHP_004",
        "origin": "Delhi",
        "destination": "Jaipur",
        "status": "Delivered",
        "risk": 0.12,
        "risk_label": "Low",
        "carrier": "Delhivery",
        "mode": "Road",
        "service_tier": "Standard",
        "weight": 650.0,
        "value": 180000.0,
        "eta": "2026-03-11T10:00:00",
        "progress": 1.0,
        "origin_coords": {"lat": 28.6139, "lng": 77.209},
        "dest_coords": {"lat": 26.9124, "lng": 75.7873},
        "current_coords": {"lat": 26.9124, "lng": 75.7873},
        "alert_text": "",
        "prediction_horizon": 72,
        "mc_dropout_mean": 0.12,
        "mc_dropout_std": 0.04,
        "conformal_lower": 0.06,
        "conformal_upper": 0.20
    },
    {
        "id": "SHP_005",
        "origin": "Ahmedabad",
        "destination": "Pune",
        "status": "In Transit",
        "risk": 0.45,
        "risk_label": "Medium",
        "carrier": "DTDC",
        "mode": "Road",
        "service_tier": "Priority",
        "weight": 1200.0,
        "value": 560000.0,
        "eta": "2026-03-13T06:00:00",
        "progress": 0.55,
        "origin_coords": {"lat": 23.0225, "lng": 72.5714},
        "dest_coords": {"lat": 18.5204, "lng": 73.8567},
        "current_coords": {"lat": 20.5937, "lng": 72.9},
        "alert_text": "Moderate traffic congestion reported on Mumbai-Pune expressway",
        "prediction_horizon": 48,
        "mc_dropout_mean": 0.45,
        "mc_dropout_std": 0.15,
        "conformal_lower": 0.32,
        "conformal_upper": 0.60
    },
    {
        "id": "SHP_006",
        "origin": "Mumbai",
        "destination": "Chennai",
        "status": "Delayed",
        "risk": 0.78,
        "risk_label": "High",
        "carrier": "BlueDart",
        "mode": "Sea",
        "service_tier": "Critical",
        "weight": 5200.0,
        "value": 2800000.0,
        "eta": "2026-03-15T20:00:00",
        "progress": 0.25,
        "origin_coords": {"lat": 19.076, "lng": 72.8777},
        "dest_coords": {"lat": 13.0827, "lng": 80.2707},
        "current_coords": {"lat": 15.3, "lng": 74.0},
        "alert_text": "Mumbai JNPT port congestion at record levels, 18hr wait time",
        "prediction_horizon": 72,
        "mc_dropout_mean": 0.78,
        "mc_dropout_std": 0.07,
        "conformal_lower": 0.68,
        "conformal_upper": 0.88
    },
    {
        "id": "SHP_007",
        "origin": "Kolkata",
        "destination": "Guwahati",
        "status": "In Transit",
        "risk": 0.22,
        "risk_label": "Low",
        "carrier": "FedEx-2",
        "mode": "Road",
        "service_tier": "Standard",
        "weight": 780.0,
        "value": 320000.0,
        "eta": "2026-03-12T22:00:00",
        "progress": 0.65,
        "origin_coords": {"lat": 22.5726, "lng": 88.3639},
        "dest_coords": {"lat": 26.1445, "lng": 91.7362},
        "current_coords": {"lat": 24.5, "lng": 89.5},
        "alert_text": "",
        "prediction_horizon": 24,
        "mc_dropout_mean": 0.22,
        "mc_dropout_std": 0.06,
        "conformal_lower": 0.14,
        "conformal_upper": 0.32
    },
    {
        "id": "SHP_008",
        "origin": "Delhi",
        "destination": "Mumbai",
        "status": "In Transit",
        "risk": 0.55,
        "risk_label": "Medium",
        "carrier": "Delhivery",
        "mode": "Air",
        "service_tier": "Critical",
        "weight": 320.0,
        "value": 4500000.0,
        "eta": "2026-03-12T08:00:00",
        "progress": 0.80,
        "origin_coords": {"lat": 28.6139, "lng": 77.209},
        "dest_coords": {"lat": 19.076, "lng": 72.8777},
        "current_coords": {"lat": 23.0, "lng": 75.0},
        "alert_text": "Fog advisory for North India, flights experiencing 2hr delays",
        "prediction_horizon": 24,
        "mc_dropout_mean": 0.55,
        "mc_dropout_std": 0.10,
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
            {"feature": "route_delay_rate", "value": 0.42, "impact": 0.324, "direction": "positive"},
            {"feature": "carrier_reliability", "value": 0.79, "impact": -0.148, "direction": "negative"},
            {"feature": "lead_time_horizon_adjusted", "value": 2.0, "impact": 0.165, "direction": "positive"},
            {"feature": "port_wait_times", "value": 18.0, "impact": 0.112, "direction": "positive"},
            {"feature": "prediction_horizon_hours", "value": 48, "impact": 0.085, "direction": "positive"},
            {"feature": "service_tier_encoded", "value": 2, "impact": 0.065, "direction": "positive"},
            {"feature": "demurrage_risk_flag", "value": 0, "impact": 0.032, "direction": "positive"},
        ],
        "timeline": [
            {"checkpoint": "Origin Warehouse", "location": "Mumbai", "time": "2026-03-10T08:00:00", "status": "completed", "risk": 0.12, "details": "Shipment dispatched from Mumbai warehouse"},
            {"checkpoint": "Road Hub 1", "location": "Vadodara", "time": "2026-03-10T18:00:00", "status": "completed", "risk": 0.31, "details": "Weather warning detected for upcoming route"},
            {"checkpoint": "Transit Hub", "location": "Bhopal", "time": "2026-03-11T06:00:00", "status": "current", "risk": 0.67, "details": "Heavy rainfall causing highway slowdowns"},
            {"checkpoint": "Customs Check", "location": "Agra", "time": "2026-03-12T00:00:00", "status": "upcoming", "risk": 0.82, "details": "Predicted: continued weather impact"},
            {"checkpoint": "Final Mile", "location": "Delhi", "time": "2026-03-13T14:00:00", "status": "upcoming", "risk": 0.87, "details": "Predicted: SLA at risk — intervene now"},
        ],
        "horizon_risks": [
            {"horizon": 24, "risk": 0.67, "label": "High"},
            {"horizon": 48, "risk": 0.87, "label": "Critical"},
            {"horizon": 72, "risk": 0.92, "label": "Critical"}
        ],
        "dice_interventions": [
            {
                "option": "Reroute via Air Freight",
                "changed_features": {"mode": "Air", "weather_severity_index": 2.0},
                "original_risk": 0.87,
                "new_risk": 0.23,
                "cost": 45000,
                "co2_delta_kg": 2340.0,
                "feasibility": "High"
            },
            {
                "option": "Assign FedEx-2 Carrier",
                "changed_features": {"carrier_reliability": 0.87},
                "original_risk": 0.87,
                "new_risk": 0.41,
                "cost": 12000,
                "co2_delta_kg": 0,
                "feasibility": "High"
            },
            {
                "option": "Hold + Pre-Alert Customer",
                "changed_features": {"lead_time_horizon_adjusted": 5.0},
                "original_risk": 0.87,
                "new_risk": 0.65,
                "cost": 0,
                "co2_delta_kg": 0,
                "feasibility": "Medium"
            }
        ],
        "kimi_recommendation": {
            "action": "Reroute via Air Freight",
            "justification": "Weather severity at 8.5/10 with route delay rate of 42% makes road transit unreliable. Air freight bypasses the NH-48 corridor weather zone entirely. FedEx-2 has 87% acceptance rate and load at 62% — capacity available.",
            "cost_of_action": 45000,
            "cost_of_sla_miss": 125000,
            "net_saving": 73000,
            "co2_delta_kg": 2340.0,
            "confidence": "High"
        },
        "history": [
            {"event": "Created", "time": "2026-03-10T06:00:00", "detail": "Shipment booked: Mumbai→Delhi, Critical tier"},
            {"event": "Dispatched", "time": "2026-03-10T08:00:00", "detail": "Left Mumbai warehouse via BlueDart road"},
            {"event": "Weather Alert", "time": "2026-03-10T14:00:00", "detail": "NOAA: Heavy rainfall forecast for central India corridor"},
            {"event": "Risk Escalation", "time": "2026-03-11T06:00:00", "detail": "Risk increased from 31% to 67% at Bhopal hub"},
            {"event": "AI Intervention", "time": "2026-03-11T08:00:00", "detail": "Guardian recommends: Reroute via Air Freight (₹45K, saves ₹73K)"},
        ]
    },
    {
        "shipment_id": "SHP_002",
        "shap_values": [
            {"feature": "carrier_reliability", "value": 0.54, "impact": 0.285, "direction": "positive"},
            {"feature": "route_delay_rate", "value": 0.38, "impact": 0.195, "direction": "positive"},
            {"feature": "labor_strike_probability", "value": 0.88, "impact": 0.175, "direction": "positive"},
            {"feature": "weather_severity_index", "value": 3.2, "impact": 0.045, "direction": "positive"},
            {"feature": "lead_time_horizon_adjusted", "value": 3.5, "impact": 0.088, "direction": "positive"},
            {"feature": "port_wait_times", "value": 8.0, "impact": 0.055, "direction": "positive"},
        ],
        "timeline": [
            {"checkpoint": "Origin Warehouse", "location": "Chennai", "time": "2026-03-11T06:00:00", "status": "completed", "risk": 0.22, "details": "Dispatched from Chennai depot"},
            {"checkpoint": "Road Hub 1", "location": "Vijayawada", "time": "2026-03-11T16:00:00", "status": "current", "risk": 0.48, "details": "Strike news impacting carrier availability"},
            {"checkpoint": "Transit Hub", "location": "Visakhapatnam", "time": "2026-03-12T04:00:00", "status": "upcoming", "risk": 0.62, "details": "Predicted: carrier delay from port strike"},
            {"checkpoint": "Final Mile", "location": "Kolkata", "time": "2026-03-14T08:00:00", "status": "upcoming", "risk": 0.68, "details": "Predicted: moderate SLA risk"},
        ],
        "horizon_risks": [
            {"horizon": 24, "risk": 0.48, "label": "Medium"},
            {"horizon": 48, "risk": 0.68, "label": "High"},
            {"horizon": 72, "risk": 0.75, "label": "High"}
        ],
        "dice_interventions": [
            {
                "option": "Assign FedEx-2 Carrier",
                "changed_features": {"carrier_reliability": 0.87},
                "original_risk": 0.68,
                "new_risk": 0.32,
                "cost": 12000,
                "co2_delta_kg": 0,
                "feasibility": "High"
            },
            {
                "option": "Reroute via Road (bypass Chennai port area)",
                "changed_features": {"labor_strike_probability": 0.10},
                "original_risk": 0.68,
                "new_risk": 0.38,
                "cost": 28000,
                "co2_delta_kg": 180.0,
                "feasibility": "Medium"
            }
        ],
        "kimi_recommendation": {
            "action": "Assign FedEx-2 Carrier",
            "justification": "DHL-4 carrier reliability at 54% is the primary risk driver. FedEx-2 at 87% reliability with 62% load capacity can absorb this shipment. Cost of ₹12K vs SLA miss penalty of ₹89K.",
            "cost_of_action": 12000,
            "cost_of_sla_miss": 89000,
            "net_saving": 68000,
            "co2_delta_kg": 0,
            "confidence": "High"
        },
        "history": [
            {"event": "Created", "time": "2026-03-10T22:00:00", "detail": "Shipment booked: Chennai→Kolkata, Priority tier"},
            {"event": "Strike Alert", "time": "2026-03-11T04:00:00", "detail": "Port workers partial strike at Chennai port"},
            {"event": "Risk Escalation", "time": "2026-03-11T16:00:00", "detail": "Risk increased to 48% due to carrier impact"},
        ]
    },
    {
        "shipment_id": "SHP_003",
        "shap_values": [
            {"feature": "route_delay_rate", "value": 0.15, "impact": -0.12, "direction": "negative"},
            {"feature": "carrier_reliability", "value": 0.87, "impact": -0.18, "direction": "negative"},
            {"feature": "weather_severity_index", "value": 2.1, "impact": -0.08, "direction": "negative"},
            {"feature": "lead_time_horizon_adjusted", "value": 6.0, "impact": -0.15, "direction": "negative"},
        ],
        "timeline": [
            {"checkpoint": "Origin Warehouse", "location": "Bangalore", "time": "2026-03-11T04:00:00", "status": "completed", "risk": 0.08, "details": "Dispatched from Bangalore hub"},
            {"checkpoint": "Transit Hub", "location": "Anantapur", "time": "2026-03-11T14:00:00", "status": "completed", "risk": 0.15, "details": "On schedule, no issues"},
            {"checkpoint": "Final Mile", "location": "Hyderabad", "time": "2026-03-12T18:00:00", "status": "upcoming", "risk": 0.31, "details": "Expected on-time delivery"},
        ],
        "horizon_risks": [
            {"horizon": 24, "risk": 0.31, "label": "Medium"},
            {"horizon": 48, "risk": 0.35, "label": "Medium"},
            {"horizon": 72, "risk": 0.38, "label": "Medium"}
        ],
        "dice_interventions": [],
        "kimi_recommendation": None,
        "history": [
            {"event": "Created", "time": "2026-03-11T02:00:00", "detail": "Shipment booked: Bangalore→Hyderabad, Standard tier"},
            {"event": "Dispatched", "time": "2026-03-11T04:00:00", "detail": "On schedule with FedEx-2 carrier"},
        ]
    },
    {
        "shipment_id": "SHP_006",
        "shap_values": [
            {"feature": "port_wait_times", "value": 18.0, "impact": 0.265, "direction": "positive"},
            {"feature": "weather_severity_index", "value": 6.8, "impact": 0.185, "direction": "positive"},
            {"feature": "route_delay_rate", "value": 0.35, "impact": 0.145, "direction": "positive"},
            {"feature": "carrier_reliability", "value": 0.79, "impact": -0.065, "direction": "negative"},
            {"feature": "demurrage_risk_flag", "value": 1, "impact": 0.125, "direction": "positive"},
        ],
        "timeline": [
            {"checkpoint": "Origin Port", "location": "Mumbai JNPT", "time": "2026-03-11T06:00:00", "status": "completed", "risk": 0.35, "details": "Vessel loaded at Mumbai port — congestion delays"},
            {"checkpoint": "Sea Transit", "location": "Arabian Sea", "time": "2026-03-12T06:00:00", "status": "current", "risk": 0.55, "details": "Moderate sea state, vessel speed reduced"},
            {"checkpoint": "Destination Port", "location": "Chennai Port", "time": "2026-03-14T18:00:00", "status": "upcoming", "risk": 0.78, "details": "Chennai port queue 12+ vessels ahead"},
            {"checkpoint": "Final Mile", "location": "Chennai", "time": "2026-03-15T20:00:00", "status": "upcoming", "risk": 0.78, "details": "Predicted late delivery — demurrage risk"},
        ],
        "horizon_risks": [
            {"horizon": 24, "risk": 0.55, "label": "Medium"},
            {"horizon": 48, "risk": 0.72, "label": "High"},
            {"horizon": 72, "risk": 0.78, "label": "High"}
        ],
        "dice_interventions": [
            {
                "option": "Divert to Tuticorin Port",
                "changed_features": {"port_wait_times": 4.0, "route_delay_rate": 0.18},
                "original_risk": 0.78,
                "new_risk": 0.35,
                "cost": 55000,
                "co2_delta_kg": 420.0,
                "feasibility": "Medium"
            },
            {
                "option": "Pre-Alert + Accept Delay",
                "changed_features": {"lead_time_horizon_adjusted": 6.0},
                "original_risk": 0.78,
                "new_risk": 0.78,
                "cost": 0,
                "co2_delta_kg": 0,
                "feasibility": "High"
            }
        ],
        "kimi_recommendation": {
            "action": "Divert to Tuticorin Port",
            "justification": "Mumbai JNPT congestion at 8.2/10 with 18hr wait. Diverting to Tuticorin reduces wait to 4hrs. Road transit from Tuticorin to Chennai adds ₹55K but saves demurrage of ₹2.1L.",
            "cost_of_action": 55000,
            "cost_of_sla_miss": 280000,
            "net_saving": 215000,
            "co2_delta_kg": 420.0,
            "confidence": "Medium"
        },
        "history": [
            {"event": "Created", "time": "2026-03-10T20:00:00", "detail": "Sea shipment booked: Mumbai→Chennai, Critical tier"},
            {"event": "Port Congestion", "time": "2026-03-11T02:00:00", "detail": "JNPT congestion index reached 8.2/10"},
            {"event": "Vessel Departed", "time": "2026-03-11T06:00:00", "detail": "Vessel departed after 12hr delay at JNPT"},
        ]
    }
]


# ──────────────────────────────────────────────────────────────
#  PORT DATA — Major Indian ports
# ──────────────────────────────────────────────────────────────
PORTS = [
    {"id": "PRT_001", "name": "Mumbai JNPT", "region": "West India", "congestion_index": 8.2, "congestion_label": "Critical",
     "predicted_delay_hrs": 18, "demurrage_risk": 210000, "demurrage_cost_est": "₹2.1L", "vessels_at_port": 12,
     "status": "Congested", "trend": "rising", "wait_time_hrs": 18},
    {"id": "PRT_002", "name": "Chennai Port", "region": "South India", "congestion_index": 4.1, "congestion_label": "Medium",
     "predicted_delay_hrs": 3, "demurrage_risk": 28000, "demurrage_cost_est": "₹28K", "vessels_at_port": 6,
     "status": "Normal", "trend": "stable", "wait_time_hrs": 3},
    {"id": "PRT_003", "name": "Delhi ICD", "region": "North India", "congestion_index": 2.0, "congestion_label": "Low",
     "predicted_delay_hrs": 0, "demurrage_risk": 0, "demurrage_cost_est": "—", "vessels_at_port": 2,
     "status": "Normal", "trend": "stable", "wait_time_hrs": 0},
    {"id": "PRT_004", "name": "Kolkata Port", "region": "East India", "congestion_index": 6.7, "congestion_label": "High",
     "predicted_delay_hrs": 9, "demurrage_risk": 75000, "demurrage_cost_est": "₹75K", "vessels_at_port": 8,
     "status": "Delayed", "trend": "rising", "wait_time_hrs": 9},
    {"id": "PRT_005", "name": "Kandla Port", "region": "West India", "congestion_index": 3.5, "congestion_label": "Low",
     "predicted_delay_hrs": 2, "demurrage_risk": 15000, "demurrage_cost_est": "₹15K", "vessels_at_port": 4,
     "status": "Normal", "trend": "falling", "wait_time_hrs": 2},
    {"id": "PRT_006", "name": "Visakhapatnam Port", "region": "South India", "congestion_index": 5.4, "congestion_label": "Medium",
     "predicted_delay_hrs": 5, "demurrage_risk": 42000, "demurrage_cost_est": "₹42K", "vessels_at_port": 7,
     "status": "Moderate", "trend": "stable", "wait_time_hrs": 5},
    {"id": "PRT_007", "name": "Tuticorin Port", "region": "South India", "congestion_index": 1.8, "congestion_label": "Low",
     "predicted_delay_hrs": 0, "demurrage_risk": 0, "demurrage_cost_est": "—", "vessels_at_port": 3,
     "status": "Normal", "trend": "stable", "wait_time_hrs": 0},
]

VESSELS = [
    {"id": "VSL_001", "name": "MV Sagarmala", "status": "Anchored", "port": "Mumbai JNPT", "eta": "2026-03-12T06:00:00", "cargo_type": "Container", "flag": "IN"},
    {"id": "VSL_002", "name": "CMA CGM Marco Polo", "status": "In Transit", "port": "Chennai Port", "eta": "2026-03-13T08:00:00", "cargo_type": "Container", "flag": "FR"},
    {"id": "VSL_003", "name": "Maersk Sealand", "status": "Loading", "port": "Kolkata Port", "eta": "2026-03-11T22:00:00", "cargo_type": "Bulk", "flag": "DK"},
    {"id": "VSL_004", "name": "MSC Divina", "status": "Anchored", "port": "Mumbai JNPT", "eta": "2026-03-12T14:00:00", "cargo_type": "Container", "flag": "CH"},
    {"id": "VSL_005", "name": "Evergreen Fortune", "status": "In Transit", "port": "Visakhapatnam Port", "eta": "2026-03-14T12:00:00", "cargo_type": "Mixed", "flag": "TW"},
]

# ──────────────────────────────────────────────────────────────
#  NETWORK GRAPH — Risk propagation connections
# ──────────────────────────────────────────────────────────────
NETWORK_GRAPH = {
    "nodes": [
        {"id": "SHP_001", "risk": 0.87, "label": "Mumbai→Delhi", "type": "shipment"},
        {"id": "SHP_002", "risk": 0.68, "label": "Chennai→Kolkata", "type": "shipment"},
        {"id": "SHP_003", "risk": 0.31, "label": "Bangalore→Hyderabad", "type": "shipment"},
        {"id": "SHP_004", "risk": 0.12, "label": "Delhi→Jaipur", "type": "shipment"},
        {"id": "SHP_005", "risk": 0.45, "label": "Ahmedabad→Pune", "type": "shipment"},
        {"id": "SHP_006", "risk": 0.78, "label": "Mumbai→Chennai", "type": "shipment"},
        {"id": "SHP_007", "risk": 0.22, "label": "Kolkata→Guwahati", "type": "shipment"},
        {"id": "SHP_008", "risk": 0.55, "label": "Delhi→Mumbai", "type": "shipment"},
        {"id": "HUB_MUM", "risk": 0.72, "label": "Mumbai Hub", "type": "hub"},
        {"id": "HUB_DEL", "risk": 0.45, "label": "Delhi Hub", "type": "hub"},
        {"id": "HUB_CHN", "risk": 0.55, "label": "Chennai Hub", "type": "hub"},
    ],
    "edges": [
        {"source": "SHP_001", "target": "SHP_006", "weight": 0.7, "relationship": "same_carrier"},
        {"source": "SHP_001", "target": "HUB_MUM", "weight": 0.8, "relationship": "same_origin"},
        {"source": "SHP_006", "target": "HUB_MUM", "weight": 0.8, "relationship": "same_origin"},
        {"source": "SHP_008", "target": "HUB_DEL", "weight": 0.6, "relationship": "same_origin"},
        {"source": "SHP_004", "target": "HUB_DEL", "weight": 0.6, "relationship": "same_origin"},
        {"source": "SHP_003", "target": "SHP_007", "weight": 0.5, "relationship": "same_carrier"},
        {"source": "SHP_002", "target": "HUB_CHN", "weight": 0.7, "relationship": "same_origin"},
        {"source": "SHP_006", "target": "HUB_CHN", "weight": 0.7, "relationship": "same_destination"},
        {"source": "SHP_001", "target": "SHP_008", "weight": 0.4, "relationship": "same_route"},
        {"source": "HUB_MUM", "target": "HUB_DEL", "weight": 0.5, "relationship": "corridor"},
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

    print(f"🌱 Seeding database: {settings.MONGODB_DB}...")

    # Clear existing data
    for collection in ["shipments", "shipment_details", "ports", "vessels",
                       "network_graph", "analytics", "settings"]:
        await db[collection].drop()
        print(f"   Cleared: {collection}")

    # Insert shipments
    await db.shipments.insert_many(SHIPMENTS)
    print(f"   ✅ Inserted {len(SHIPMENTS)} shipments")

    # Insert shipment details
    if SHIPMENT_DETAILS:
        await db.shipment_details.insert_many(SHIPMENT_DETAILS)
        print(f"   ✅ Inserted {len(SHIPMENT_DETAILS)} shipment details")

    # Insert ports
    await db.ports.insert_many(PORTS)
    print(f"   ✅ Inserted {len(PORTS)} ports")

    # Insert vessels
    await db.vessels.insert_many(VESSELS)
    print(f"   ✅ Inserted {len(VESSELS)} vessels")

    # Insert network graph
    await db.network_graph.insert_one(NETWORK_GRAPH)
    print(f"   ✅ Inserted network graph ({len(NETWORK_GRAPH['nodes'])} nodes, {len(NETWORK_GRAPH['edges'])} edges)")

    # Insert default settings
    await db.settings.insert_one(DEFAULT_SETTINGS)
    print(f"   ✅ Inserted default settings")

    # Create indexes
    await db.shipments.create_index("id", unique=True)
    await db.shipment_details.create_index("shipment_id", unique=True)
    await db.ports.create_index("id", unique=True)
    await db.vessels.create_index("id", unique=True)
    print(f"   ✅ Created indexes")

    print(f"\n🎉 Database seeded successfully!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
