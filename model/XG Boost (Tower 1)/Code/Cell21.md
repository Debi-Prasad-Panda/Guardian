# Cell 21
# ══════════════════════════════════════════════════════════════════════
# CELL 21 — Model Performance Visualizations (6 stunning plots)
# ══════════════════════════════════════════════════════════════════════

import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patheffects as pe
from sklearn.metrics import roc_curve, precision_recall_curve, auc
from sklearn.calibration import calibration_curve

fig = plt.figure(figsize=(22, 28), facecolor='#0a0a1a')
fig.suptitle('🧠  TOWER 1 — XGBoost MODEL PERFORMANCE DASHBOARD',
             fontsize=24, fontweight='bold', color='#e0e0ff', y=0.98,
             path_effects=[pe.withStroke(linewidth=3, foreground='#2a2a4a')])

gs = gridspec.GridSpec(3, 2, hspace=0.35, wspace=0.3, top=0.95, bottom=0.05)

# ── PLOT 1: ROC Curve with AUC ──
ax1 = fig.add_subplot(gs[0, 0])
fpr, tpr, _ = roc_curve(y_test, y_proba)
roc_auc = auc(fpr, tpr)
ax1.fill_between(fpr, tpr, alpha=0.15, color='#6C63FF')
ax1.plot(fpr, tpr, color='#6C63FF', linewidth=2.5, label=f'XGBoost (AUC = {roc_auc:.4f})')
ax1.plot([0, 1], [0, 1], color='#FF6584', linestyle='--', linewidth=1.5, alpha=0.6, label='Random')
ax1.set_xlabel('False Positive Rate', fontsize=12)
ax1.set_ylabel('True Positive Rate', fontsize=12)
ax1.set_title('📈 ROC Curve', pad=15, fontsize=16)
ax1.legend(fontsize=12, loc='lower right', framealpha=0.3)
ax1.grid(alpha=0.15, color='#4a4a6a')
# Highlight optimal point
optimal_idx = (tpr - fpr).argmax()
ax1.scatter(fpr[optimal_idx], tpr[optimal_idx], s=150, c='#00D4AA',
            zorder=5, edgecolors='white', linewidths=2)
ax1.annotate(f'Optimal\n({fpr[optimal_idx]:.3f}, {tpr[optimal_idx]:.3f})',
             (fpr[optimal_idx], tpr[optimal_idx]),
             xytext=(20, -20), textcoords='offset points',
             fontsize=10, color='#00D4AA', fontweight='bold',
             arrowprops=dict(arrowstyle='->', color='#00D4AA'))

# ── PLOT 2: Precision-Recall Curve ──
ax2 = fig.add_subplot(gs[0, 1])
precision, recall, _ = precision_recall_curve(y_test, y_proba)
pr_auc = auc(recall, precision)
ax2.fill_between(recall, precision, alpha=0.15, color='#FF6584')
ax2.plot(recall, precision, color='#FF6584', linewidth=2.5, label=f'PR Curve (AUC = {pr_auc:.4f})')
ax2.axhline(y=y_test.mean(), color='#FFB347', linestyle='--', linewidth=1.5,
            alpha=0.6, label=f'Baseline ({y_test.mean():.2%})')
ax2.set_xlabel('Recall', fontsize=12)
ax2.set_ylabel('Precision', fontsize=12)
ax2.set_title('🎯 Precision-Recall Curve', pad=15, fontsize=16)
ax2.legend(fontsize=12, loc='lower left', framealpha=0.3)
ax2.grid(alpha=0.15, color='#4a4a6a')

# ── PLOT 3: Confusion Matrix (Styled) ──
ax3 = fig.add_subplot(gs[1, 0])
cm = confusion_matrix(y_test, y_pred)
cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
im = ax3.imshow(cm_normalized, cmap='PuBu', aspect='auto', vmin=0, vmax=1)
ax3.set_xticks([0, 1])
ax3.set_yticks([0, 1])
ax3.set_xticklabels(['On Time', 'Late Risk'], fontsize=13)
ax3.set_yticklabels(['On Time', 'Late Risk'], fontsize=13)
ax3.set_xlabel('Predicted', fontsize=13, fontweight='bold')
ax3.set_ylabel('Actual', fontsize=13, fontweight='bold')
for i in range(2):
    for j in range(2):
        color = '#000000' if cm_normalized[i, j] > 0.5 else '#e0e0ff'
        ax3.text(j, i, f'{cm[i,j]:,}\n({cm_normalized[i,j]:.1%})',
                 ha='center', va='center', fontsize=14, fontweight='bold', color=color)
ax3.set_title('🔲 Confusion Matrix', pad=15, fontsize=16)
plt.colorbar(im, ax=ax3, fraction=0.046, pad=0.04)

# ── PLOT 4: Feature Importance (XGBoost + SHAP comparison) ──
ax4 = fig.add_subplot(gs[1, 1])
importance = xgb_model.feature_importances_
sorted_idx = np.argsort(importance)
features_sorted = [FINAL_FEATURES[i] for i in sorted_idx]
importance_sorted = importance[sorted_idx]

# Color gradient based on importance
colors = [plt.cm.cool(v / max(importance_sorted)) for v in importance_sorted]
bars = ax4.barh(range(len(features_sorted)), importance_sorted,
                color=colors, edgecolor='#2a2a4a', linewidth=0.5, height=0.65)
ax4.set_yticks(range(len(features_sorted)))
ax4.set_yticklabels([f.replace('_', ' ').title() for f in features_sorted], fontsize=10)
ax4.set_xlabel('Feature Importance', fontsize=12)
ax4.set_title('⚡ XGBoost Feature Importance', pad=15, fontsize=16)
ax4.grid(axis='x', alpha=0.15, color='#4a4a6a')
for bar, val in zip(bars, importance_sorted):
    if val > 0.02:
        ax4.text(val + 0.003, bar.get_y() + bar.get_height()/2,
                 f'{val:.3f}', va='center', fontsize=9, color='#e0e0ff')

# ── PLOT 5: Risk Score Distribution ──
ax5 = fig.add_subplot(gs[2, 0])
on_time_proba = y_proba[y_test == 0]
delayed_proba = y_proba[y_test == 1]
ax5.hist(on_time_proba, bins=80, alpha=0.6, color='#00D4AA', label='Actually On Time',
         density=True, edgecolor='none')
ax5.hist(delayed_proba, bins=80, alpha=0.6, color='#FF6B6B', label='Actually Delayed',
         density=True, edgecolor='none')
ax5.axvline(x=0.5, color='#FFB347', linestyle='--', linewidth=2, alpha=0.8, label='Threshold (0.5)')
ax5.set_xlabel('Predicted Risk Score', fontsize=12)
ax5.set_ylabel('Density', fontsize=12)
ax5.set_title('📊 Risk Score Distribution by True Outcome', pad=15, fontsize=16)
ax5.legend(fontsize=11, framealpha=0.3)
ax5.grid(axis='y', alpha=0.15, color='#4a4a6a')

# ── PLOT 6: Calibration Curve ──
ax6 = fig.add_subplot(gs[2, 1])
fraction_pos, mean_predicted = calibration_curve(y_test, y_proba, n_bins=15, strategy='uniform')
ax6.plot([0, 1], [0, 1], color='#4a4a6a', linestyle='--', linewidth=1.5, label='Perfectly Calibrated')
ax6.plot(mean_predicted, fraction_pos, color='#6C63FF', linewidth=2.5,
         marker='o', markersize=8, markerfacecolor='#FF6584',
         markeredgecolor='white', markeredgewidth=1.5, label='XGBoost Tower 1')
ax6.fill_between(mean_predicted, fraction_pos, mean_predicted, alpha=0.1, color='#6C63FF')
ax6.set_xlabel('Mean Predicted Probability', fontsize=12)
ax6.set_ylabel('Fraction of Positives', fontsize=12)
ax6.set_title('📐 Calibration Curve', pad=15, fontsize=16)
ax6.legend(fontsize=12, loc='lower right', framealpha=0.3)
ax6.grid(alpha=0.15, color='#4a4a6a')
ax6.set_xlim(-0.02, 1.02)
ax6.set_ylim(-0.02, 1.02)

plt.savefig('/kaggle/working/model_performance_plots.png', dpi=150, bbox_inches='tight',
            facecolor='#0a0a1a', edgecolor='none')
plt.show()
print('✅ Model performance plots saved!')
