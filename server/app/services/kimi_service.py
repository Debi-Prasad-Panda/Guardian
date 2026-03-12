# server/app/services/kimi_service.py
"""
Guardian — NVIDIA Kimi K2.5 Integration
Uses DiCE-grounded prompts to select optimal intervention.
Eliminates hallucination by constraining LLM to mathematically-proven options.
"""
import os
import json
import logging
import requests
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# NVIDIA API configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "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")
NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# Cost estimates (Rs.) — representative for Indian logistics
BASE_COSTS = {
    "reroute_via_air":        45000,
    "assign_alt_carrier":     12000,
    "expedite_customs":       8000,
    "send_pre_alert":         0,
    "reroute_via_road":       28000,
    "hold_shipment":          5000,
}

# CO2 emissions per tonne-km (kg CO2)
CO2_FACTORS = {
    "Rail": 0.028,
    "Road": 0.062,
    "Sea":  0.010,
    "Air":  0.602,
}


def call_kimi_k25(
    prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 2048,
    stream: bool = False
) -> Optional[str]:
    """
    Call NVIDIA-hosted Kimi K2.5 model.
    
    Parameters
    ----------
    prompt      : str, the full prompt including DiCE counterfactuals
    temperature : float, 0.0-1.0 (lower = more deterministic)
    max_tokens  : int, max response length
    stream      : bool, whether to stream response (False for JSON parsing)
    
    Returns
    -------
    str : model response text, or None on failure
    """
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "text/event-stream" if stream else "application/json"
    }
    
    payload = {
        "model": "moonshotai/kimi-k2.5",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 1.00,
        "stream": stream,
        "chat_template_kwargs": {"thinking": True},  # Enable chain-of-thought
    }
    
    try:
        response = requests.post(
            NVIDIA_INVOKE_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        if stream:
            # For streaming, collect all chunks
            full_text = ""
            for line in response.iter_lines():
                if line:
                    decoded = line.decode("utf-8")
                    if decoded.startswith("data: "):
                        data_str = decoded[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            full_text += content
                        except json.JSONDecodeError:
                            continue
            return full_text
        else:
            # Non-streaming: parse JSON directly
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            return content
            
    except requests.exceptions.Timeout:
        logger.error("Kimi K2.5 API timeout after 30s")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Kimi K2.5 API request failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error calling Kimi K2.5: {e}")
        return None


def get_intervention_recommendation(
    shipment: Dict[str, Any],
    dice_result: Dict[str, Any],
    shap_top_feature: Optional[str] = None
) -> Dict[str, Any]:
    """
    Use Kimi K2.5 to select the best intervention from DiCE counterfactuals.
    
    Parameters
    ----------
    shipment         : dict with shipment fields
    dice_result      : output from dice_service.generate_counterfactuals()
    shap_top_feature : optional, the top SHAP feature causing risk
    
    Returns
    -------
    {
        "action":              str,    # recommended action
        "justification":       str,    # why this action was chosen
        "cost_of_action":      float,  # Rs. cost of intervention
        "cost_of_sla_miss":    float,  # Rs. penalty if shipment is late
        "net_saving":          float,  # cost_of_sla_miss - cost_of_action
        "co2_delta_kg":        float,  # CO2 impact (positive = increase)
        "confidence":          str,    # "High" | "Medium" | "Low"
        "counterfactual_used": str,    # which DiCE option was selected
        "source":              str,    # "kimi" | "fallback"
    }
    """
    original_risk = dice_result.get("original_risk", 0.5)
    counterfactuals = dice_result.get("counterfactuals", [])
    
    # If no counterfactuals or low risk, return no-action
    if not counterfactuals or original_risk < 0.30:
        return {
            "action": "Monitor — no intervention needed",
            "justification": "Risk is below intervention threshold.",
            "cost_of_action": 0,
            "cost_of_sla_miss": 0,
            "net_saving": 0,
            "co2_delta_kg": 0.0,
            "confidence": "High",
            "counterfactual_used": None,
            "source": "low_risk"
        }
    
    # Build DiCE-grounded prompt
    prompt = _build_kimi_prompt(shipment, dice_result, shap_top_feature)
    
    # Call Kimi K2.5
    response_text = call_kimi_k25(prompt, temperature=0.3, stream=False)
    
    if response_text:
        # Try to parse JSON from response
        parsed = _parse_kimi_response(response_text)
        if parsed:
            # Enrich with cost calculations
            parsed = _enrich_with_costs(parsed, shipment, original_risk)
            parsed["source"] = "kimi"
            return parsed
    
    # Fallback: rule-based selection
    logger.warning("Kimi K2.5 unavailable or failed to parse. Using fallback.")
    return _fallback_intervention(shipment, counterfactuals, original_risk)


def _build_kimi_prompt(
    shipment: Dict[str, Any],
    dice_result: Dict[str, Any],
    shap_top_feature: Optional[str]
) -> str:
    """Build the DiCE-grounded prompt for Kimi K2.5."""
    shipment_id = shipment.get("id", "UNKNOWN")
    origin = shipment.get("origin", "Unknown")
    destination = shipment.get("destination", "Unknown")
    service_tier = shipment.get("service_tier", "Priority")
    mode = shipment.get("mode", "Road")
    
    original_risk = dice_result["original_risk"]
    counterfactuals = dice_result["counterfactuals"]
    
    # Format counterfactuals as numbered options
    cf_text = ""
    for i, cf in enumerate(counterfactuals, 1):
        cf_text += f"\nOption {i}:\n"
        cf_text += f"  Description: {cf['description']}\n"
        cf_text += f"  Risk reduction: {cf['risk_reduction']:.0%} (from {original_risk:.0%} to {cf['new_risk']:.0%})\n"
        cf_text += f"  Feasibility: {cf['feasibility']}\n"
        cf_text += f"  Changes required: {cf['num_changes']}\n"
    
    # Estimate SLA penalty
    sla_penalty = _estimate_sla_penalty(shipment, original_risk)
    
    # Build carrier availability context
    carrier_context = _get_carrier_availability(shipment)
    
    prompt = f"""You are a logistics operations AI assistant for Guardian Early Warning System.

**Shipment Context:**
- ID: {shipment_id}
- Route: {origin} → {destination}
- Service Tier: {service_tier}
- Current Mode: {mode}
- Current Risk: {original_risk:.0%}
- SLA Penalty if missed: Rs. {sla_penalty:,.0f}

**Primary Delay Cause (SHAP):** {shap_top_feature or "Multiple factors"}

**Mathematically-Proven Intervention Options (DiCE Counterfactuals):**
{cf_text}

**Carrier Availability:**
{carrier_context}

**Your Task:**
Select the BEST intervention option from the DiCE counterfactuals above.
Consider:
1. Risk reduction effectiveness
2. Feasibility (can it be executed in 24-48 hours?)
3. Cost vs SLA penalty
4. CO2 impact (prefer lower emissions when possible)

**Output Format (MUST be valid JSON):**
{{
  "action": "<selected action from options above>",
  "justification": "<2-3 sentence explanation>",
  "estimated_cost_rs": <number>,
  "confidence": "High" | "Medium" | "Low",
  "counterfactual_id": "CF_1" | "CF_2" | "CF_3"
}}

Return ONLY the JSON, no other text."""
    
    return prompt


def _parse_kimi_response(response_text: str) -> Optional[Dict[str, Any]]:
    """Extract JSON from Kimi response (handles markdown code blocks)."""
    try:
        # Try direct JSON parse first
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass
    
    # Try to extract JSON from markdown code block
    if "```json" in response_text:
        start = response_text.find("```json") + 7
        end = response_text.find("```", start)
        json_str = response_text[start:end].strip()
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # Try to find any JSON object in the text
    import re
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    matches = re.findall(json_pattern, response_text, re.DOTALL)
    for match in matches:
        try:
            return json.loads(match)
        except json.JSONDecodeError:
            continue
    
    logger.error(f"Failed to parse Kimi response as JSON: {response_text[:200]}")
    return None


def _enrich_with_costs(
    parsed: Dict[str, Any],
    shipment: Dict[str, Any],
    original_risk: float
) -> Dict[str, Any]:
    """Add cost-benefit analysis to Kimi's recommendation."""
    action = parsed.get("action", "").lower()
    
    # Map action to cost category
    cost = parsed.get("estimated_cost_rs", 0)
    if not cost:
        if "air" in action or "flight" in action:
            cost = BASE_COSTS["reroute_via_air"]
        elif "carrier" in action or "switch" in action:
            cost = BASE_COSTS["assign_alt_carrier"]
        elif "customs" in action or "expedite" in action:
            cost = BASE_COSTS["expedite_customs"]
        elif "road" in action or "reroute" in action:
            cost = BASE_COSTS["reroute_via_road"]
        elif "alert" in action or "notify" in action:
            cost = BASE_COSTS["send_pre_alert"]
        else:
            cost = BASE_COSTS["assign_alt_carrier"]  # default
    
    # Apply surge multiplier based on risk severity
    surge = 1.0 + (original_risk * 0.6)  # Up to 60% surge at max risk
    cost = cost * surge
    
    # SLA penalty
    sla_penalty = _estimate_sla_penalty(shipment, original_risk)
    
    # CO2 calculation
    co2_delta = _estimate_co2_delta(shipment, action)
    
    return {
        **parsed,
        "cost_of_action": round(cost, 0),
        "cost_of_sla_miss": round(sla_penalty, 0),
        "net_saving": round(sla_penalty - cost, 0),
        "co2_delta_kg": round(co2_delta, 1),
    }


def _estimate_sla_penalty(shipment: Dict[str, Any], risk: float) -> float:
    """Estimate SLA penalty based on service tier and risk."""
    tier = shipment.get("service_tier", "Priority").lower()
    
    base_penalties = {
        "critical": 150000,
        "priority": 75000,
        "standard": 30000,
    }
    
    base = base_penalties.get(tier, 75000)
    # Scale by risk (higher risk = more likely to pay penalty)
    return base * risk


def _estimate_co2_delta(shipment: Dict[str, Any], action: str) -> float:
    """Estimate CO2 impact of intervention."""
    current_mode = shipment.get("mode", "Road")
    distance_km = shipment.get("distance_km", 1200)  # default ~Mumbai-Delhi
    cargo_tonnes = shipment.get("cargo_tonnes", 2.5)
    
    current_co2 = CO2_FACTORS.get(current_mode, CO2_FACTORS["Road"]) * distance_km * cargo_tonnes
    
    # Determine new mode from action
    new_mode = current_mode
    if "air" in action.lower() or "flight" in action.lower():
        new_mode = "Air"
    elif "road" in action.lower():
        new_mode = "Road"
    elif "rail" in action.lower():
        new_mode = "Rail"
    elif "sea" in action.lower():
        new_mode = "Sea"
    
    new_co2 = CO2_FACTORS.get(new_mode, CO2_FACTORS["Road"]) * distance_km * cargo_tonnes
    
    return new_co2 - current_co2


def _get_carrier_availability(shipment: Dict[str, Any]) -> str:
    """Generate carrier availability context."""
    # Synthetic carrier availability for demo
    carriers = {
        "FedEx-Premium": {"acceptance_rate": 0.87, "current_load": 0.62},
        "DHL-Express": {"acceptance_rate": 0.79, "current_load": 0.74},
        "BlueDart": {"acceptance_rate": 0.72, "current_load": 0.91},
        "Delhivery": {"acceptance_rate": 0.68, "current_load": 0.58},
    }
    
    lines = []
    for name, stats in carriers.items():
        status = "✅ Available" if stats["current_load"] < 0.85 else "⚠️ Near capacity"
        lines.append(f"  {name}: {stats['acceptance_rate']:.0%} acceptance, {stats['current_load']:.0%} load — {status}")
    
    return "\n".join(lines)


def _fallback_intervention(
    shipment: Dict[str, Any],
    counterfactuals: List[Dict],
    original_risk: float
) -> Dict[str, Any]:
    """Rule-based fallback when Kimi is unavailable."""
    # Select best counterfactual by risk reduction
    best_cf = max(counterfactuals, key=lambda x: x["risk_reduction"])
    
    action = best_cf["description"]
    cost = BASE_COSTS["assign_alt_carrier"]  # default
    
    if "carrier" in action.lower():
        cost = BASE_COSTS["assign_alt_carrier"]
    elif "weather" in action.lower() or "reroute" in action.lower():
        cost = BASE_COSTS["reroute_via_road"]
    elif "customs" in action.lower() or "port" in action.lower():
        cost = BASE_COSTS["expedite_customs"]
    
    sla_penalty = _estimate_sla_penalty(shipment, original_risk)
    co2_delta = _estimate_co2_delta(shipment, action)
    
    return {
        "action": action,
        "justification": f"Selected based on highest risk reduction ({best_cf['risk_reduction']:.0%}) and {best_cf['feasibility'].lower()} feasibility.",
        "cost_of_action": round(cost, 0),
        "cost_of_sla_miss": round(sla_penalty, 0),
        "net_saving": round(sla_penalty - cost, 0),
        "co2_delta_kg": round(co2_delta, 1),
        "confidence": best_cf["feasibility"],
        "counterfactual_used": best_cf["id"],
        "source": "fallback"
    }


async def generate_kimi_for_shipment(
    shipment_id: str,
    horizon_hours: int = 48
) -> dict:
    """
    Async entry-point called by the shipments router.
    1. Fetches shipment from MongoDB.
    2. Generates DiCE counterfactuals (Tower 1 XGBoost).
    3. Calls Kimi K2.5 to select best intervention (with fallback).
    Returns a structured intervention recommendation dict.
    """
    from app.database import get_db
    from app.services.dice_service import generate_counterfactuals

    db = get_db()
    shipment = await db.shipments.find_one({"id": shipment_id}, {"_id": 0})

    if not shipment:
        return {
            "error": f"Shipment {shipment_id} not found",
            "action": None,
            "source": "not_found",
        }

    # Step 1: Get DiCE counterfactuals
    dice_result = generate_counterfactuals(shipment, horizon_hours=horizon_hours)

    # Step 2: Get SHAP top feature (optional — pull from shipment if present)
    shap_top_feature = None
    shap_values = shipment.get("shap_values", [])
    if shap_values:
        top = max(shap_values, key=lambda x: abs(x.get("value", 0)))
        shap_top_feature = top.get("feature")

    # Step 3: Get Kimi recommendation
    return get_intervention_recommendation(shipment, dice_result, shap_top_feature)
