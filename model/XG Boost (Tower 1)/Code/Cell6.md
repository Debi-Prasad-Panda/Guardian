# Cell 6
euro_raw = pd.read_csv('/kaggle/input/datasets/datasetengineer/euro-crop-agricultural-logistics-dataset/EuroCrop_agricultural_logistics_dataset.csv')

print('Euro Crop columns:', euro_raw.columns.tolist())
print(f'Shape: {euro_raw.shape}')
print(f'Delivery_Time stats:\n{euro_raw["Delivery_Time"].describe()}')

# Derive target: shipments with Delivery_Time above 75th percentile = delayed
threshold = euro_raw['Delivery_Time'].quantile(0.75)
euro_raw['target'] = (euro_raw['Delivery_Time'] > threshold).astype(int)
print(f'\nDelay threshold (75th percentile): {threshold:.2f}')

# Map available columns to our schema
euro = pd.DataFrame({
    'days_real':         (euro_raw['Delivery_Time'] / 24).clip(1, 30).astype(int),  # hours to days
    'days_scheduled':    (euro_raw['Delivery_Time'] / 24 * 0.8).clip(1, 20).astype(int),  # estimated
    'target':            euro_raw['target'].astype(int),
    'shipping_mode':     euro_raw['Vehicle_Type'].str.lower().str.strip(),
    'origin_city':       'europe',
    'dest_city':         'europe',
    'origin_country':    'europe',
    'dest_country':      'europe',
    'carrier_id':        euro_raw['Vehicle_Type'].str.lower().str.strip(),
    'route_distance_km': euro_raw['Route_Distance'],
    'cargo_weight_kg':   euro_raw['Vehicle_Load_Capacity'],
    'region':            'europe',
    'data_source':       3
})

print(f'\n✅ Euro Crop loaded: {len(euro):,} rows')
print(f'Target distribution: {euro["target"].value_counts().to_dict()}')
print(f'Delay rate: {euro["target"].mean():.2%}')
