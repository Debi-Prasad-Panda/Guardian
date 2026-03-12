# Cell 19
# ══════════════════════════════════════════════════════════════════════
# CELL 19 — Save All Models and Artifacts
# ══════════════════════════════════════════════════════════════════════

import pickle

xgb_model.save_model('/kaggle/working/xgb_tower1_model.json')

with open('/kaggle/working/mapie_model.pkl', 'wb') as f:
    pickle.dump(mapie_model, f)

with open('/kaggle/working/calibrated_model.pkl', 'wb') as f:
    pickle.dump(calibrated_model, f)

artifacts = {
    'FINAL_FEATURES': FINAL_FEATURES,
    'carrier_reliability_map': carrier_reliability_map,
    'route_delay_map': route_delay_map,
}
with open('/kaggle/working/tower1_artifacts.pkl', 'wb') as f:
    pickle.dump(artifacts, f)

combined.sample(1000, random_state=42).to_csv(
    '/kaggle/working/sample_combined.csv', index=False)

print('✅ All models and artifacts saved to /kaggle/working/')
