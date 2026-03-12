# Cell 16
import shap

explainer   = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test[:500])

print('📊 Generating SHAP summary plot...')
shap.summary_plot(shap_values, X_test[:500], feature_names=FINAL_FEATURES,
                  show=True, max_display=14)

def get_shap_explanation(shipment_row):
    sv = explainer.shap_values(shipment_row.values.reshape(1, -1))
    sorted_idx = np.argsort(np.abs(sv[0]))[::-1]
    top_feature = FINAL_FEATURES[sorted_idx[0]]
    top_value   = sv[0][sorted_idx[0]]
    return {
        'top_feature':    top_feature,
        'top_shap_value': round(float(top_value), 4),
        'shap_values':    sv[0],
        'feature_names':  FINAL_FEATURES
    }

sample_shap = get_shap_explanation(X_test.iloc[0])
print(f'\n✅ SHAP ready! Sample explanation:')
print(f'  Top feature: {sample_shap["top_feature"]}')
print(f'  SHAP value:  {sample_shap["top_shap_value"]}')
