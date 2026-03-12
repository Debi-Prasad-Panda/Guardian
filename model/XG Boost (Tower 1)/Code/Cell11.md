# Cell 11
# ══════════════════════════════════════════════════════════════════════
# CELL 11 — Full Feature Engineering Pipeline
# Weather injection, port congestion, NLP placeholders, chaos injection
# ══════════════════════════════════════════════════════════════════════

# 1. Core lead time feature (Fixed Data Leakage)
# Cannot use 'days_real' because actual delivery duration is unknown at prediction time (T-48hrs)
combined['lead_time'] = combined['days_scheduled']

# 2. Shipping mode encoding
mode_map = {
    'standard': 0, 'second class': 0, 'road': 0,
    'first class': 1, 'express': 1, 'flight': 1,
    'same day': 2, 'air': 2,
    'sea': 0, 'ship': 0,
}
combined['shipping_mode_encoded'] = combined['shipping_mode'].map(mode_map).fillna(0).astype(int)

# 3. Service tier encoding (default Priority for unknown)
combined['service_tier_encoded'] = 1  # default to Priority

# 4. Inject synthetic weather features
np.random.seed(42)
combined['precipitation_mm']     = np.random.exponential(5, len(combined))
combined['wind_speed_kmh']       = np.random.exponential(15, len(combined))
combined['extreme_weather_flag'] = (np.random.random(len(combined)) < 0.08).astype(int)

# Boost weather for known weather-prone regions
weather_regions = ['south_america', 'southeast_asia', 'india']
mask = combined['region'].isin(weather_regions)
combined.loc[mask, 'precipitation_mm'] *= 1.8
combined.loc[mask, 'extreme_weather_flag'] = (np.random.random(mask.sum()) < 0.15).astype(int)

# 5. Weather severity composite index
combined['weather_severity_index'] = (
    combined['precipitation_mm'] * 0.4 +
    combined['wind_speed_kmh']  * 0.3 +
    combined['extreme_weather_flag'] * 30
).clip(0, 100)

# 6. Inject synthetic port wait times
combined['port_wait_times'] = np.random.exponential(8, len(combined))
port_regions = {'india': 12, 'south_america': 10, 'southeast_asia': 9}
for region_name, multiplier in port_regions.items():
    region_mask = combined['region'] == region_name
    combined.loc[region_mask, 'port_wait_times'] = np.random.exponential(
        multiplier, region_mask.sum())
combined['demurrage_risk_flag'] = (combined['port_wait_times'] > 24).astype(int)

# 7. Inject FinBERT NLP scores (placeholders — replaced by Tower B later)
combined['news_sentiment_score']      = np.random.uniform(-1, 0.5, len(combined))
combined['labor_strike_probability']  = np.random.beta(1.5, 8, len(combined))
combined['geopolitical_risk_score']   = np.random.beta(2, 6, len(combined))

# 8. Probabilistic chaos injection (85/15 split — prevents overfitting)
chaos_mask = np.random.random(len(combined)) < 0.15
combined.loc[chaos_mask, 'weather_severity_index']   = np.random.uniform(70, 100, chaos_mask.sum())
combined.loc[chaos_mask, 'port_wait_times']          = np.random.uniform(20, 48, chaos_mask.sum())
combined.loc[chaos_mask, 'labor_strike_probability'] = np.random.uniform(0.6, 1.0, chaos_mask.sum())
combined.loc[chaos_mask, 'target'] = np.random.choice(
    [1, 0], size=chaos_mask.sum(), p=[0.85, 0.15]
)

print(f'✅ Feature engineering complete!')
print(f'Shape: {combined.shape}')
print(f'Chaos rows injected: {chaos_mask.sum():,} ({chaos_mask.mean():.1%})')
print(f'\nFeature summary:')
feature_cols = ['lead_time', 'carrier_reliability', 'route_delay_rate',
                'weather_severity_index', 'port_wait_times',
                'news_sentiment_score', 'labor_strike_probability']
print(combined[feature_cols].describe().round(3))
