# Cell 12
# ══════════════════════════════════════════════════════════════════════
# CELL 12 — Multi-Horizon Row Multiplication (×3 → ~1.18M rows)
# Trains ONE model for T+24, T+48, T+72 predictions
# ══════════════════════════════════════════════════════════════════════

horizon_frames = []
for h in [24, 48, 72]:
    df_h = combined.copy()
    df_h['prediction_horizon_hours'] = h
    df_h['lead_time_horizon_adjusted'] = df_h['lead_time'] - (h / 24)
    horizon_frames.append(df_h)

final_train = pd.concat(horizon_frames, ignore_index=True)

# Define final feature set for XGBoost
FINAL_FEATURES = [
    'lead_time',
    'lead_time_horizon_adjusted',
    'carrier_reliability',
    'route_delay_rate',
    'weather_severity_index',
    'port_wait_times',
    'demurrage_risk_flag',
    'shipping_mode_encoded',
    'service_tier_encoded',
    'prediction_horizon_hours',
    'news_sentiment_score',
    'labor_strike_probability',
    'geopolitical_risk_score',
]

X = final_train[FINAL_FEATURES]
y = final_train['target']

print(f'✅ Multi-horizon expansion complete!')
print(f'Final training dataset: {len(final_train):,} rows x {len(FINAL_FEATURES)} features')
print(f'Target balance: {y.mean():.2%} positive (late)')
print(f'\nFeatures: {FINAL_FEATURES}')
