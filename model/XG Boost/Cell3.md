# Cell 3
# ══════════════════════════════════════════════════════════════════════
# CELL 3 — Load DataCo Smart Supply Chain (Tier 1 Core — 180K rows)
# ⚠️ Update path if Cell 2 shows a different folder name
# ══════════════════════════════════════════════════════════════════════

dataco_raw = pd.read_csv('/kaggle/input/datasets/evilspirit05/datasupplychain/DataCoSupplyChainDataset.csv',
                         encoding='latin-1')

# Validate columns exist
required_cols = ['Days for shipping (real)', 'Days for shipment (scheduled)',
                 'Late_delivery_risk', 'Shipping Mode', 'Order City',
                 'Customer City', 'Order Country', 'Customer Country']

missing = [c for c in required_cols if c not in dataco_raw.columns]
if missing:
    print(f'⚠️ Missing columns: {missing}')
    print(f'Available columns: {dataco_raw.columns.tolist()}')
    raise ValueError(f'DataCo missing columns: {missing}')

dataco = pd.DataFrame({
    'days_real':        dataco_raw['Days for shipping (real)'],
    'days_scheduled':   dataco_raw['Days for shipment (scheduled)'],
    'target':           dataco_raw['Late_delivery_risk'].astype(int),
    'shipping_mode':    dataco_raw['Shipping Mode'].str.lower().str.strip(),
    'origin_city':      dataco_raw['Order City'].str.lower().str.strip(),
    'dest_city':        dataco_raw['Customer City'].str.lower().str.strip(),
    'origin_country':   dataco_raw['Order Country'].str.lower().str.strip(),
    'dest_country':     dataco_raw['Customer Country'].str.lower().str.strip(),
    'carrier_id':       dataco_raw['Shipping Mode'].str.lower().str.strip(),
    'region':           'usa_global',
    'data_source':      0
})

print(f'✅ DataCo loaded: {len(dataco):,} rows')
print(f'Target distribution: {dataco["target"].value_counts().to_dict()}')
print(f'Delay rate: {dataco["target"].mean():.2%}')
print(f'Sample shipping modes: {dataco["shipping_mode"].unique().tolist()}')
