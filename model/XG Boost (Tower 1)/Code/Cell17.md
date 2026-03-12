# Cell 17
import mapie.classification as mc
print(dir(mc))

# ══════════════════════════════════════════════════════════════════════
# CELL 17 — MAPIE Conformal Prediction (XGBoost Uncertainty)
# ══════════════════════════════════════════════════════════════════════

from mapie.classification import SplitConformalClassifier

mapie_model = SplitConformalClassifier(estimator=xgb_model, confidence_level=0.90)
mapie_model.conformalize(X_calib, y_calib)

def predict_with_interval(shipment_row):
    result = mapie_model.predict(shipment_row.values.reshape(1, -1))
    risk_score = calibrated_model.predict_proba(shipment_row.values.reshape(1, -1))[0][1]
    return {
        'risk_score': round(float(risk_score), 4),
        'prediction_set': result,
    }

sample = predict_with_interval(X_test.iloc[0])
print(f'✅ MAPIE Conformal Prediction ready!')
print(f'  Risk Score: {sample["risk_score"]:.2%}')
print(f'  Prediction Set: {sample["prediction_set"]}')
