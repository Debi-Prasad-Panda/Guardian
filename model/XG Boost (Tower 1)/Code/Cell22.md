# Cell 22
# ══════════════════════════════════════════════════════════════════════
# CELL 22 — Key Metrics Summary Card (Presentation-Ready)
# ══════════════════════════════════════════════════════════════════════

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe

fig, ax = plt.subplots(figsize=(16, 9), facecolor='#0a0a1a')
ax.set_xlim(0, 16)
ax.set_ylim(0, 9)
ax.axis('off')

# Title
ax.text(8, 8.3, '🧠 TOWER 1 — XGBoost PERFORMANCE SUMMARY',
        ha='center', va='center', fontsize=22, fontweight='bold', color='#e0e0ff',
        path_effects=[pe.withStroke(linewidth=3, foreground='#2a2a4a')])
ax.text(8, 7.7, 'AI Early Warning System for Shipment Delays | InnovateX 5.0',
        ha='center', va='center', fontsize=13, color='#8080b0')

# Metric cards
metrics = [
    ('AUC-ROC',     f'{roc_auc_score(y_test, y_proba):.4f}', '#6C63FF', '📈'),
    ('F1 Score',    f'{f1_score(y_test, y_pred):.4f}',        '#FF6584', '🎯'),
    ('Accuracy',    f'{accuracy_score(y_test, y_pred):.4f}',  '#00D4AA', '✅'),
    ('Recall',      f'{cm[1][1]/(cm[1][0]+cm[1][1]):.4f}',   '#FFB347', '🔍'),
]

for i, (name, value, color, emoji) in enumerate(metrics):
    x = 1.5 + i * 3.5
    y = 5.5
    # Card background
    card = mpatches.FancyBboxPatch((x - 1.3, y - 1.2), 2.8, 2.6,
                                   boxstyle="round,pad=0.15",
                                   facecolor=color, alpha=0.12,
                                   edgecolor=color, linewidth=2)
    ax.add_patch(card)
    # Emoji
    ax.text(x + 0.1, y + 0.8, emoji, ha='center', va='center', fontsize=28)
    # Value
    ax.text(x + 0.1, y + 0.0, value, ha='center', va='center',
            fontsize=26, fontweight='bold', color=color)
    # Label
    ax.text(x + 0.1, y - 0.7, name, ha='center', va='center',
            fontsize=13, color='#8080b0', fontweight='bold')

# Bottom stats
stats = [
    f'Training Rows: {len(X_train):,}',
    f'Test Rows: {len(X_test):,}',
    f'Features: {len(FINAL_FEATURES)}',
    f'Datasets Fused: 5',
    f'Leaf Embeddings: 500-dim',
    f'Prediction Horizons: 24h / 48h / 72h',
]

ax.text(8, 2.8, '─── KEY STATISTICS ───', ha='center', va='center',
        fontsize=14, color='#6C63FF', fontweight='bold')

for i, stat in enumerate(stats):
    col = i % 3
    row = i // 3
    x = 3 + col * 5
    y = 2.0 - row * 0.7
    ax.text(x, y, f'▸ {stat}', ha='center', va='center',
            fontsize=12, color='#c0c0ff')

# Footer
ax.text(8, 0.3, 'Tower 1 Complete → Ready for Tower 2 (FinBERT + MLP Fusion)',
        ha='center', va='center', fontsize=11, color='#4a4a6a', style='italic')

plt.savefig('/kaggle/working/metrics_summary_card.png', dpi=150, bbox_inches='tight',
            facecolor='#0a0a1a', edgecolor='none')
plt.show()
print('✅ Metrics summary card saved!')
