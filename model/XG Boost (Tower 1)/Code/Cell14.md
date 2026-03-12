# Cell 14
# ══════════════════════════════════════════════════════════════════════
# CELL 14 — Train XGBoost with Optimized Hyperparameters
# ══════════════════════════════════════════════════════════════════════

xgb_model = xgb.XGBClassifier(
    n_estimators      = 500,
    max_depth         = 6,
    learning_rate     = 0.05,
    subsample         = 0.8,
    colsample_bytree  = 0.8,
    min_child_weight  = 3,
    gamma             = 0.1,
    reg_alpha         = 0.1,
    reg_lambda        = 1.0,
    scale_pos_weight  = (y_train == 0).sum() / (y_train == 1).sum(),
    use_label_encoder = False,
    eval_metric       = 'auc',
    random_state      = 42,
    n_jobs            = -1,
    tree_method       = 'hist',
)

print('🚀 Training XGBoost... (this may take a few minutes on ~1M rows)')
xgb_model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=100
)
print('✅ XGBoost training complete!')

from sklearn.calibration import CalibratedClassifierCV

print('⚙️ Calibrating model using Platt scaling...')
calibrated_model = CalibratedClassifierCV(
    xgb_model, 
    method='sigmoid',   # Platt scaling
    cv='prefit'         # model already trained
)
calibrated_model.fit(X_calib, y_calib)
print('✅ Model calibration complete!')
