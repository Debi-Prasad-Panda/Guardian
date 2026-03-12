# Cell 5
indo_raw = pd.read_csv('/kaggle/input/datasets/adisaputra10/e-commerce-shipping-data/dataset_ecommerce (8).csv')

# ontime is string: 'Ontime' / 'Delayed' → map to binary target
indo_raw['target'] = (indo_raw['ontime'] == 'Delayed').astype(int)

indo_raw['days_scheduled'] = indo_raw['estimated_delivery_time_days'].clip(1, 30)
indo_raw['days_real'] = indo_raw['days_scheduled'] + \
    (indo_raw['target'] * np.random.randint(1, 4, len(indo_raw)))

indo = pd.DataFrame({
    'days_real':        indo_raw['days_real'],
    'days_scheduled':   indo_raw['days_scheduled'],
    'target':           indo_raw['target'].astype(int),
    'shipping_mode':    indo_raw['type_of_delivery'].str.lower().str.strip(),
    'origin_city':      indo_raw['district'].str.lower().str.strip(),
    'dest_city':        indo_raw['city'].str.lower().str.strip(),
    'origin_country':   'indonesia',
    'dest_country':     'indonesia',
    'carrier_id':       indo_raw['courier_delivery'].str.lower().str.strip(),
    'region':           'southeast_asia',
    'data_source':      2
})

print(f'✅ Indonesia loaded: {len(indo):,} rows')
print(f'Target distribution: {indo["target"].value_counts().to_dict()}')
print(f'Delay rate: {indo["target"].mean():.2%}')
