# Cell 15
# ══════════════════════════════════════════════════════════════════════
# CELL 15 — Evaluate Model & Print Metrics for Judges
# ══════════════════════════════════════════════════════════════════════

# 1. Get calibrated probabilities
y_proba = calibrated_model.predict_proba(X_test)[:, 1]

# 2. Set an aggressive business threshold (default is 0.50)
# Lowering this to 0.14 means we are more aggressive about catching delays!
CUSTOM_THRESHOLD = 0.14  
y_pred = (y_proba >= CUSTOM_THRESHOLD).astype(int)

# 3. Print Results
print('=' * 60)
print(f'  TOWER 1 — MODEL EVALUATION (Threshold: {CUSTOM_THRESHOLD:.2f})')
print('=' * 60)
print(f'Accuracy:  {accuracy_score(y_test, y_pred):.4f}')
print(f'F1 Score:  {f1_score(y_test, y_pred):.4f}')
print(f'AUC-ROC:   {roc_auc_score(y_test, y_proba):.4f}')
print()
print('Classification Report:')
print(classification_report(y_test, y_pred, target_names=['On Time', 'Late Risk']))
print()
print('Confusion Matrix:')
cm = confusion_matrix(y_test, y_pred)
print(cm)
print(f'\nTrue Negatives:  {cm[0][0]:,}')
print(f'False Positives: {cm[0][1]:,}')
print(f'False Negatives: {cm[1][0]:,}')
print(f'True Positives:  {cm[1][1]:,}')

print('\n💡 BUSINESS IMPACT:')
print(f"By lowering threshold to {CUSTOM_THRESHOLD}, we catch a much higher percentage of delayed shipments!")
