"""
smoke_test.py - Guardian Three-Tower End-to-End Smoke Test
Run from the server/ directory:
    python smoke_test.py

Does NOT require a running server. Imports services directly.
"""
import sys, os
# Force UTF-8 output on Windows cmd terminals
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

PASS = "[PASS]"
FAIL = "[FAIL]"

print("=" * 60)
print("Guardian Three-Tower Smoke Test")
print("=" * 60)

# -- Test 1: Tower 1 XGBoost load -----------------------------------
print("\n[1] Loading Tower 1 XGBoost...")
try:
    from app.services.xgb_service import load_tower1, predict_tower1
    booster, artifacts = load_tower1()
    features = artifacts.get("FINAL_FEATURES", [])
    print(f"    {PASS} Loaded. Features ({len(features)}): {features}")
except Exception as e:
    print(f"    {FAIL} {e}")
    sys.exit(1)

# -- Test 2: Tower 2 MiniLM load ------------------------------------
print("\n[2] Loading Tower 2 MiniLM...")
try:
    from app.services.nlp_service import get_nlp_features
    nlp_out = get_nlp_features("Port workers strike at Mumbai JNPT announce 72-hour strike")
    print(f"    {PASS} Source: {nlp_out['source']}")
    print(f"    Labor: {nlp_out['labor_strike_probability']:.3f}  "
          f"Geo: {nlp_out['geopolitical_risk_score']:.3f}  "
          f"Weather: {nlp_out['weather_severity_score']:.3f}")
    print(f"    NLP embedding dim: {len(nlp_out['nlp_embedding'])}")
except Exception as e:
    print(f"    {FAIL} {e}")
    sys.exit(1)

# -- Test 3: Tower 3 MLP load ---------------------------------------
print("\n[3] Loading Tower 3 MLP...")
try:
    from app.services.mlp_service import load_tower3
    _, meta = load_tower3()
    print(f"    {PASS} Loaded. input_dim={meta['input_dim']}  val_AUC={meta.get('val_auc',0):.4f}")
except Exception as e:
    print(f"    {FAIL} {e}")
    sys.exit(1)

# -- Test 4: Full pipeline -------------------------------------------
print("\n[4] Full three-tower pipeline (SHP_001 prototype)...")
SHP_001 = {
    "id":          "SHP_001",
    "origin":      "Mumbai",
    "destination": "Delhi",
    "carrier":     "BlueDart",
    "mode":        "Road",
    "service_tier": "Critical",
    "days_scheduled": 3.0,
    "alert_text":  "Severe weather warning: Heavy rainfall predicted along NH-48 corridor",
}
try:
    from app.services.fusion_service import predict_full_pipeline
    result = predict_full_pipeline(SHP_001, horizon_hours=48)
    print(f"    {PASS} Pipeline succeeded!")
    print(f"    risk_score:       {result['risk_score']}")
    print(f"    uncertainty:      {result['uncertainty']}")
    print(f"    confidence_label: {result['confidence_label']}")
    print(f"    interval:         [{result['interval_low']}, {result['interval_high']}]")
    print(f"    display:          {result['display']}")
    print(f"    t1_risk:          {result['t1_risk']}")
    print(f"    nlp_source:       {result['nlp_source']}")
    print(f"    labor_strike:     {result['labor_strike_probability']:.3f}")
    print(f"    geo_risk:         {result['geopolitical_risk_score']:.3f}")
    print(f"    weather_score:    {result['weather_severity_score']:.3f}")
except Exception as e:
    import traceback
    print(f"    {FAIL} {e}")
    traceback.print_exc()
    sys.exit(1)

# -- Test 5: Verify fusion vector shape ------------------------------
print("\n[5] Fusion vector shape check...")
try:
    from app.services.fusion_service import build_fusion_vector, FUSION_DIM
    vec = build_fusion_vector(SHP_001, horizon_hours=48)
    assert vec.shape[0] == FUSION_DIM, f"Expected {FUSION_DIM}, got {vec.shape[0]}"
    print(f"    {PASS} Fusion vector shape: {vec.shape}  (expected {FUSION_DIM})")
    print(f"    dtype: {vec.dtype}  min={vec.min():.4f}  max={vec.max():.4f}")
except Exception as e:
    import traceback
    print(f"    {FAIL} {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("ALL SMOKE TESTS PASSED")
print("=" * 60)
