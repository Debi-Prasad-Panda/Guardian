# Cell 10
combined['route_key'] = combined['origin_country'] + '->' + combined['dest_country']

route_stats = (
    combined.groupby('route_key')['target']
    .agg(['mean', 'count'])
    .reset_index()
)
route_stats.columns = ['route_key', 'route_delay_rate', 'route_count']

route_delay_map = route_stats.set_index('route_key')['route_delay_rate'].to_dict()
combined['route_delay_rate'] = combined['route_key'].map(route_delay_map).fillna(0.25)

print(f'✅ Route delay rates computed for {len(route_delay_map)} routes')
print(f'\nAll routes by delay rate:')
print(route_stats.sort_values('route_delay_rate', ascending=False)[
    ['route_key', 'route_delay_rate', 'route_count']
].to_string(index=False))
