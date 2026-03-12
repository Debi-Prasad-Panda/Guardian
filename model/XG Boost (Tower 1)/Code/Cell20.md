# Cell 20
# ══════════════════════════════════════════════════════════════════════
# CELL 20 — Data Analysis Visualizations (6 stunning plots)
# ══════════════════════════════════════════════════════════════════════

import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.patches import FancyBboxPatch
import matplotlib.patheffects as pe

# Set premium dark theme
plt.style.use('dark_background')
plt.rcParams.update({
    'figure.facecolor': '#0a0a1a',
    'axes.facecolor': '#0a0a1a',
    'axes.edgecolor': '#2a2a4a',
    'text.color': '#e0e0ff',
    'axes.labelcolor': '#c0c0ff',
    'xtick.color': '#8080b0',
    'ytick.color': '#8080b0',
    'font.family': 'sans-serif',
    'font.size': 11,
    'axes.titlesize': 14,
    'axes.titleweight': 'bold',
})

# Color palette
COLORS = {
    'primary':   '#6C63FF',
    'secondary': '#FF6584',
    'accent1':   '#00D4AA',
    'accent2':   '#FFB347',
    'accent3':   '#FF6B6B',
    'accent4':   '#4ECDC4',
    'gradient':  ['#6C63FF', '#9B59B6', '#FF6584', '#FFB347', '#00D4AA'],
}

fig = plt.figure(figsize=(22, 28), facecolor='#0a0a1a')
fig.suptitle('🛳️  AI EARLY WARNING SYSTEM — DATA FUSION ANALYSIS',
             fontsize=24, fontweight='bold', color='#e0e0ff', y=0.98,
             path_effects=[pe.withStroke(linewidth=3, foreground='#2a2a4a')])

gs = gridspec.GridSpec(3, 2, hspace=0.35, wspace=0.3, top=0.95, bottom=0.05)

# ── PLOT 1: Dataset Composition (Donut Chart) ──
ax1 = fig.add_subplot(gs[0, 0])
sources = ['DataCo\n(USA)', 'Olist\n(Brazil)', 'Indonesia', 'Euro Crop\n(Europe)', 'Synthetic\n(India/China)']
sizes = [len(dataco), len(olist), len(indo), len(euro), len(synth)]
colors = COLORS['gradient']
explode = (0.02, 0.02, 0.06, 0.02, 0.02)

wedges, texts, autotexts = ax1.pie(
    sizes, labels=sources, autopct='%1.1f%%', startangle=140,
    colors=colors, explode=explode, pctdistance=0.78,
    wedgeprops=dict(width=0.45, edgecolor='#0a0a1a', linewidth=2),
    textprops=dict(color='#e0e0ff', fontsize=10)
)
for t in autotexts:
    t.set_fontsize(9)
    t.set_color('#ffffff')
    t.set_fontweight('bold')
ax1.set_title('📊 Dataset Composition', pad=15, fontsize=16)
centre_circle = plt.Circle((0, 0), 0.30, fc='#0a0a1a')
ax1.add_artist(centre_circle)
ax1.text(0, 0, f'{sum(sizes):,}\nrows', ha='center', va='center',
         fontsize=14, fontweight='bold', color='#6C63FF')

# ── PLOT 2: Delay Rate by Region (Horizontal Bar) ──
ax2 = fig.add_subplot(gs[0, 1])
region_delay = combined.groupby('region')['target'].mean().sort_values(ascending=True)
bars = ax2.barh(range(len(region_delay)), region_delay.values * 100,
                color=[plt.cm.RdYlGn_r(v) for v in region_delay.values],
                edgecolor='#2a2a4a', linewidth=0.5, height=0.6)
ax2.set_yticks(range(len(region_delay)))
ax2.set_yticklabels([r.replace('_', ' ').title() for r in region_delay.index], fontsize=11)
ax2.set_xlabel('Delay Rate (%)', fontsize=12)
ax2.set_title('🌍 Delay Rate by Region', pad=15, fontsize=16)
for i, (bar, val) in enumerate(zip(bars, region_delay.values)):
    ax2.text(val * 100 + 0.8, i, f'{val:.1%}', va='center', fontsize=11,
             fontweight='bold', color='#e0e0ff')
ax2.set_xlim(0, max(region_delay.values * 100) * 1.25)
ax2.grid(axis='x', alpha=0.15, color='#4a4a6a')

# ── PLOT 3: Shipping Mode Distribution (Grouped Bar) ──
ax3 = fig.add_subplot(gs[1, 0])
mode_delay = combined.groupby('shipping_mode')['target'].agg(['mean', 'count'])
mode_delay = mode_delay[mode_delay['count'] > 1000].sort_values('mean', ascending=False).head(8)
x_pos = range(len(mode_delay))
bars3 = ax3.bar(x_pos, mode_delay['mean'] * 100,
                color=[COLORS['gradient'][i % len(COLORS['gradient'])] for i in range(len(mode_delay))],
                edgecolor='#2a2a4a', linewidth=0.5, width=0.65,
                alpha=0.85)
ax3.set_xticks(x_pos)
ax3.set_xticklabels([m.title() for m in mode_delay.index], rotation=35, ha='right', fontsize=10)
ax3.set_ylabel('Delay Rate (%)', fontsize=12)
ax3.set_title('📦 Delay Rate by Shipping Mode', pad=15, fontsize=16)
for bar, val in zip(bars3, mode_delay['mean']):
    ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
             f'{val:.1%}', ha='center', fontsize=10, fontweight='bold', color='#e0e0ff')
ax3.grid(axis='y', alpha=0.15, color='#4a4a6a')

# ── PLOT 4: Feature Correlation Heatmap ──
ax4 = fig.add_subplot(gs[1, 1])
corr_features = ['lead_time', 'carrier_reliability', 'route_delay_rate',
                 'weather_severity_index', 'port_wait_times',
                 'labor_strike_probability', 'target']
corr_matrix = combined[corr_features].corr()
im = ax4.imshow(corr_matrix, cmap='RdBu_r', vmin=-1, vmax=1, aspect='auto')
ax4.set_xticks(range(len(corr_features)))
ax4.set_yticks(range(len(corr_features)))
short_names = ['Lead\nTime', 'Carrier\nReliab.', 'Route\nDelay', 'Weather\nSeverity',
               'Port\nWait', 'Strike\nProb.', 'Target']
ax4.set_xticklabels(short_names, fontsize=9)
ax4.set_yticklabels(short_names, fontsize=9)
for i in range(len(corr_features)):
    for j in range(len(corr_features)):
        val = corr_matrix.iloc[i, j]
        color = '#000000' if abs(val) > 0.5 else '#e0e0ff'
        ax4.text(j, i, f'{val:.2f}', ha='center', va='center',
                 fontsize=9, fontweight='bold', color=color)
plt.colorbar(im, ax=ax4, fraction=0.046, pad=0.04)
ax4.set_title('🔗 Feature Correlation Matrix', pad=15, fontsize=16)

# ── PLOT 5: Lead Time Distribution by Outcome ──
ax5 = fig.add_subplot(gs[2, 0])
on_time = combined[combined['target'] == 0]['lead_time'].clip(-10, 15)
delayed = combined[combined['target'] == 1]['lead_time'].clip(-10, 15)
ax5.hist(on_time, bins=50, alpha=0.6, color=COLORS['accent1'], label='On Time',
         density=True, edgecolor='none')
ax5.hist(delayed, bins=50, alpha=0.6, color=COLORS['accent3'], label='Delayed',
         density=True, edgecolor='none')
ax5.axvline(x=0, color='#FFB347', linestyle='--', linewidth=2, alpha=0.8, label='Threshold')
ax5.set_xlabel('Lead Time (days_real − days_scheduled)', fontsize=12)
ax5.set_ylabel('Density', fontsize=12)
ax5.set_title('⏱️ Lead Time Distribution by Outcome', pad=15, fontsize=16)
ax5.legend(fontsize=11, loc='upper right', framealpha=0.3)
ax5.grid(axis='y', alpha=0.15, color='#4a4a6a')

# ── PLOT 6: Carrier Reliability vs Delay Rate (Scatter) ──
ax6 = fig.add_subplot(gs[2, 1])
scatter_data = carrier_stats[carrier_stats['shipment_count'] >= 100].copy()
sizes_scatter = (scatter_data['shipment_count'] / scatter_data['shipment_count'].max()) * 500 + 30
scatter = ax6.scatter(
    scatter_data['carrier_reliability'], scatter_data['delay_rate'] * 100,
    s=sizes_scatter, c=scatter_data['delay_rate'],
    cmap='RdYlGn_r', alpha=0.75, edgecolors='#4a4a6a', linewidths=0.5
)
ax6.set_xlabel('Carrier Reliability Score', fontsize=12)
ax6.set_ylabel('Delay Rate (%)', fontsize=12)
ax6.set_title('🚚 Carrier Reliability vs Delay Rate', pad=15, fontsize=16)
ax6.grid(alpha=0.15, color='#4a4a6a')
plt.colorbar(scatter, ax=ax6, label='Delay Rate', fraction=0.046, pad=0.04)

# Add annotation for worst carriers
for _, row in scatter_data.nlargest(3, 'delay_rate').iterrows():
    ax6.annotate(row['carrier_id'], (row['carrier_reliability'], row['delay_rate'] * 100),
                 fontsize=8, color='#FF6584', fontweight='bold',
                 xytext=(10, 5), textcoords='offset points',
                 arrowprops=dict(arrowstyle='->', color='#FF6584', lw=0.8))

plt.savefig('/kaggle/working/data_analysis_plots.png', dpi=150, bbox_inches='tight',
            facecolor='#0a0a1a', edgecolor='none')
plt.show()
print('✅ Data analysis plots saved!')
