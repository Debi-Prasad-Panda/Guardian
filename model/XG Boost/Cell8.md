# Cell 8
COMMON_COLS = [
    'days_real', 'days_scheduled', 'target',
    'shipping_mode', 'origin_city', 'dest_city',
    'origin_country', 'dest_country', 'carrier_id',
    'region', 'data_source'
]

def harmonize(df, name):
    for col in COMMON_COLS:
        if col not in df.columns:
            if col in ['days_real', 'days_scheduled']:
                df[col] = 5
            elif col == 'target':
                raise ValueError(f'{name}: target column is mandatory')
            else:
                df[col] = 'unknown'
    df['days_real']      = df['days_real'].clip(0, 60)
    df['days_scheduled'] = df['days_scheduled'].clip(0, 60)
    df['target']         = df['target'].astype(int).clip(0, 1)
    return df[COMMON_COLS].copy()

datasets = [
    (dataco, 'DataCo'),
    (olist,  'Olist Brazil'),
    (indo,   'Indonesia'),
    (euro,   'Euro Crop'),
    (synth,  'Synthetic India/China'),
]

harmonized = []
for df, name in datasets:
    h = harmonize(df.copy(), name)
    harmonized.append(h)
    print(f'{name:25s}: {len(h):>8,} rows | delay rate = {h["target"].mean():.2%}')

combined = pd.concat(harmonized, ignore_index=True)

print(f'\n{"="*60}')
print(f'COMBINED TOTAL: {len(combined):,} rows')
print(f'Overall delay rate: {combined["target"].mean():.2%}')
print(f'{"="*60}')
print(f'\nSource distribution:\n{combined["data_source"].value_counts().sort_index()}')
print(f'\nRegion distribution:\n{combined["region"].value_counts()}')
