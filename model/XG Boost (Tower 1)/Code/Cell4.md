# Cell 4
# ══════════════════════════════════════════════════════════════════════
# CELL 4 — Load Olist Brazilian E-Commerce (Tier 2 — 100K rows)
# Requires joining 3 tables + deriving target from dates
# ⚠️ Update paths if Cell 2 shows different folder names
# ══════════════════════════════════════════════════════════════════════

orders  = pd.read_csv('/kaggle/input/datasets/organizations/olistbr/brazilian-ecommerce/olist_orders_dataset.csv')
sellers = pd.read_csv('/kaggle/input/datasets/organizations/olistbr/brazilian-ecommerce/olist_sellers_dataset.csv')
items   = pd.read_csv('/kaggle/input/datasets/organizations/olistbr/brazilian-ecommerce/olist_order_items_dataset.csv')

# Parse dates
for col in ['order_purchase_timestamp',
            'order_delivered_customer_date',
            'order_estimated_delivery_date']:
    orders[col] = pd.to_datetime(orders[col], errors='coerce')

# Drop rows where delivery dates are null (incomplete/cancelled orders)
orders = orders.dropna(subset=['order_delivered_customer_date',
                               'order_estimated_delivery_date'])

# DERIVE TARGET: 1 if delivered AFTER estimated date
orders['target'] = (
    orders['order_delivered_customer_date'] >
    orders['order_estimated_delivery_date']
).astype(int)

# Compute lead time in days
orders['days_real'] = (
    orders['order_delivered_customer_date'] -
    orders['order_purchase_timestamp']
).dt.days

orders['days_scheduled'] = (
    orders['order_estimated_delivery_date'] -
    orders['order_purchase_timestamp']
).dt.days

# Get seller state for origin
items_agg = items.groupby('order_id')['seller_id'].first().reset_index()
orders = orders.merge(items_agg, on='order_id', how='left')
sellers_slim = sellers[['seller_id', 'seller_state']].drop_duplicates('seller_id')
orders = orders.merge(sellers_slim, on='seller_id', how='left')

olist = pd.DataFrame({
    'days_real':       orders['days_real'].clip(0, 60),
    'days_scheduled':  orders['days_scheduled'].clip(0, 60),
    'target':          orders['target'].astype(int),
    'shipping_mode':   'standard',   # Olist is always standard e-commerce
    'origin_city':     orders['seller_state'].str.lower().fillna('unknown'),
    'dest_city':       'brazil_customer',
    'origin_country':  'brazil',
    'dest_country':    'brazil',
    'carrier_id':      'olist_carrier',
    'region':          'south_america',
    'data_source':     1
})

print(f'✅ Olist loaded: {len(olist):,} rows')
print(f'Target distribution: {olist["target"].value_counts().to_dict()}')
print(f'Delay rate: {olist["target"].mean():.2%}')
