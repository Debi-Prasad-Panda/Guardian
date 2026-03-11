# Cell 7
def generate_india_china(n_per_region=25000, random_seed=42):
    np.random.seed(random_seed)
    rows = []
    regions = {
        'india': {
            'base_delay_rate': 0.34, 'weather_disruption_prob': 0.18,
            'port_congestion_factor': 1.4, 'carrier_reliability_range': (0.55, 0.85),
            'lead_time_range': (2, 14),
            'origins': ['Mumbai', 'Delhi', 'Chennai', 'Bangalore', 'Kolkata',
                        'Hyderabad', 'Pune', 'Ahmedabad'],
            'carriers': ['BlueDart', 'Delhivery', 'DTDC',
                         'Ecom Express', 'XpressBees', 'Shadowfax'],
        },
        'china': {
            'base_delay_rate': 0.28, 'weather_disruption_prob': 0.12,
            'port_congestion_factor': 1.2, 'carrier_reliability_range': (0.65, 0.90),
            'lead_time_range': (1, 12),
            'origins': ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen',
                        'Chengdu', 'Tianjin', 'Wuhan', 'Hangzhou'],
            'carriers': ['SF Express', 'Cainiao', 'ZTO Express',
                         'YTO Express', 'Deppon', 'JD Logistics'],
        }
    }
    for region_name, params in regions.items():
        for _ in range(n_per_region):
            carrier     = np.random.choice(params['carriers'])
            carrier_rel = np.random.uniform(*params['carrier_reliability_range'])
            days_sched  = np.random.randint(*params['lead_time_range'])
            weather_hit = np.random.random() < params['weather_disruption_prob']
            port_hit    = np.random.random() < 0.10
            p_delay  = params['base_delay_rate']
            p_delay += (1 - carrier_rel) * 0.30
            p_delay += 0.20 if weather_hit else 0
            p_delay += 0.15 * (params['port_congestion_factor'] - 1)
            p_delay  = min(p_delay, 0.95)
            is_late     = np.random.random() < p_delay
            days_actual = days_sched + (np.random.randint(1, 5) if is_late else 0)
            rows.append({
                'days_real': days_actual, 'days_scheduled': days_sched,
                'target': int(is_late),
                'shipping_mode': np.random.choice(['road', 'air', 'sea', 'express']),
                'origin_city': np.random.choice(params['origins']).lower(),
                'dest_city': np.random.choice(params['origins']).lower(),
                'origin_country': region_name, 'dest_country': region_name,
                'carrier_id': carrier.lower().replace(' ', '_'),
                'region': region_name, 'data_source': 4
            })
    return pd.DataFrame(rows)

synth = generate_india_china(n_per_region=25000)

print(f'✅ Synthetic India/China generated: {len(synth):,} rows')
print(f'Target distribution: {synth["target"].value_counts().to_dict()}')
print(f'India delay rate: {synth[synth.origin_country=="india"]["target"].mean():.2%}')
print(f'China delay rate: {synth[synth.origin_country=="china"]["target"].mean():.2%}')
