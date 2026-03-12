"""
Guardian — DiCE + Kimi K2.5 Integration Test
Tests the full intervention pipeline end-to-end.
"""
import asyncio
import sys
import os

# Add server to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server"))

from app.services.dice_service import generate_counterfactuals
from app.services.kimi_service import get_intervention_recommendation
from app.services.fusion_service import predict_full_pipeline


async def test_intervention_pipeline():
    """Test the full DiCE + Kimi K2.5 pipeline."""
    
    print("=" * 80)
    print("GUARDIAN — DiCE + Kimi K2.5 Intervention Pipeline Test")
    print("=" * 80)
    
    # Test shipment: high-risk scenario
    test_shipment = {
        "id": "TEST_001",
        "alert_text": "Severe monsoon flooding disrupts Mumbai port operations. Port strike likely within 48 hours.",
        "origin": "Mumbai",
        "destination": "Delhi",
        "mode": "Road",
        "service_tier": "Critical",
        "carrier": "BlueDart",
        "days_scheduled": 5.0,
        "port_wait_times": 28.0,
        "weather_severity_index": 75.0,
        "precipitation_mm": 120.0,
        "wind_speed_kmh": 65.0,
        "extreme_weather_flag": 1,
        "distance_km": 1400,
        "cargo_tonnes": 3.5,
    }
    
    print("\n📦 TEST SHIPMENT:")
    print(f"   ID: {test_shipment['id']}")
    print(f"   Route: {test_shipment['origin']} → {test_shipment['destination']}")
    print(f"   Service Tier: {test_shipment['service_tier']}")
    print(f"   Alert: {test_shipment['alert_text'][:80]}...")
    
    # Step 1: Full three-tower prediction
    print("\n" + "─" * 80)
    print("STEP 1: Three-Tower Risk Prediction")
    print("─" * 80)
    
    try:
        prediction = predict_full_pipeline(test_shipment, horizon_hours=48)
        print(f"✅ Risk Score: {prediction['risk_score']:.1%} ± {prediction['uncertainty']:.1%}")
        print(f"   Confidence: {prediction['confidence_label']}")
        print(f"   Interval: [{prediction['interval_low']:.1%}, {prediction['interval_high']:.1%}]")
        print(f"   Tower 1 (XGBoost): {prediction['t1_risk']:.1%}")
        print(f"   NLP Source: {prediction['nlp_source']}")
        print(f"   Labor Strike Risk: {prediction['labor_strike_probability']:.1%}")
        print(f"   Geopolitical Risk: {prediction['geopolitical_risk_score']:.1%}")
        print(f"   Weather Severity: {prediction['weather_severity_score']:.1%}")
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        return
    
    # Step 2: Generate DiCE counterfactuals
    print("\n" + "─" * 80)
    print("STEP 2: DiCE Counterfactual Generation")
    print("─" * 80)
    
    try:
        dice_result = generate_counterfactuals(
            test_shipment,
            horizon_hours=48,
            num_counterfactuals=3
        )
        
        print(f"✅ Original Risk: {dice_result['original_risk']:.1%}")
        print(f"   Source: {dice_result['source']}")
        print(f"   Actionable Levers: {', '.join(dice_result['actionable_levers'][:5])}")
        print(f"\n   Generated {len(dice_result['counterfactuals'])} counterfactual scenarios:\n")
        
        for i, cf in enumerate(dice_result['counterfactuals'], 1):
            print(f"   Option {i}: {cf['id']}")
            print(f"      Description: {cf['description']}")
            print(f"      Risk Reduction: {cf['risk_reduction']:.1%} (→ {cf['new_risk']:.1%})")
            print(f"      Feasibility: {cf['feasibility']}")
            print(f"      Changes: {cf['num_changes']} features")
            print()
    except Exception as e:
        print(f"❌ DiCE generation failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 3: Get Kimi K2.5 recommendation
    print("─" * 80)
    print("STEP 3: Kimi K2.5 Intervention Recommendation")
    print("─" * 80)
    
    try:
        intervention = get_intervention_recommendation(
            test_shipment,
            dice_result,
            shap_top_feature="weather_severity_index"
        )
        
        print(f"✅ Recommended Action: {intervention['action']}")
        print(f"   Justification: {intervention['justification']}")
        print(f"   Cost of Action: Rs. {intervention['cost_of_action']:,.0f}")
        print(f"   Cost of SLA Miss: Rs. {intervention['cost_of_sla_miss']:,.0f}")
        print(f"   Net Saving: Rs. {intervention['net_saving']:,.0f}")
        print(f"   CO2 Impact: {intervention['co2_delta_kg']:+.1f} kg")
        print(f"   Confidence: {intervention['confidence']}")
        print(f"   Counterfactual Used: {intervention.get('counterfactual_used', 'N/A')}")
        print(f"   Source: {intervention['source']}")
        
    except Exception as e:
        print(f"❌ Kimi recommendation failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Summary
    print("\n" + "=" * 80)
    print("INTERVENTION CARD SUMMARY")
    print("=" * 80)
    print(f"""
🚨 SHIPMENT: {test_shipment['id']} — {test_shipment['origin']} → {test_shipment['destination']}
📊 RISK: {prediction['risk_score']:.0%} ± {prediction['uncertainty']:.0%} ({prediction['confidence_label']})

🎯 RECOMMENDED ACTION:
   {intervention['action']}

💡 WHY:
   {intervention['justification']}

💰 COST-BENEFIT:
   Intervention Cost:  Rs. {intervention['cost_of_action']:>10,.0f}
   SLA Penalty:        Rs. {intervention['cost_of_sla_miss']:>10,.0f}
   ─────────────────────────────────────
   NET SAVING:         Rs. {intervention['net_saving']:>10,.0f}

🌱 SUSTAINABILITY:
   CO2 Impact: {intervention['co2_delta_kg']:+.1f} kg CO2e

✅ CONFIDENCE: {intervention['confidence']}
    """)
    
    print("=" * 80)
    print("✅ FULL PIPELINE TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_intervention_pipeline())
