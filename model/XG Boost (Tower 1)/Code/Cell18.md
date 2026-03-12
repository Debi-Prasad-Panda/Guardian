# Cell 18
# ══════════════════════════════════════════════════════════════════════
# CELL 18 — Tower 1 Fusion Handoff Function
# ══════════════════════════════════════════════════════════════════════
import pandas as pd

def predict_for_fusion(shipment_row):
    row_df = pd.DataFrame([shipment_row[FINAL_FEATURES].values], columns=FINAL_FEATURES)
    risk_score = float(calibrated_model.predict_proba(row_df)[0][1])
    leaf_embeddings = xgb_model.apply(row_df)[0].astype(float)
    shap_info = get_shap_explanation(shipment_row[FINAL_FEATURES])
    prediction_set = mapie_model.predict(row_df)
    return {
        'risk_score':       risk_score,
        'leaf_embeddings':  leaf_embeddings,
        'top_shap_feature': shap_info['top_feature'],
        'shap_values':      shap_info['shap_values'],
        'prediction_set':   prediction_set,
    }

sample = X_test.iloc[0]
result = predict_for_fusion(sample)

print('✅ Tower 1 Fusion Handoff Function ready!')
print(f'  Risk Score:       {result["risk_score"]:.2%}')
print(f'  Top SHAP Feature: {result["top_shap_feature"]}')
print(f'  Leaf Embed dim:   {len(result["leaf_embeddings"])}')
print(f'  Prediction Set:   {result["prediction_set"]}')
print(f'\n🎉 TOWER 1 PIPELINE COMPLETE — Ready for Tower 2!')
