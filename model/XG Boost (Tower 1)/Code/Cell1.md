# Cell 1
# ══════════════════════════════════════════════════════════════════════
# CELL 1 — Install Dependencies & Imports
# INNOVATE X 5.0 | AI Early Warning System | Tower 1 Pipeline
# ══════════════════════════════════════════════════════════════════════

!pip install polars mapie dice-ml shap --quiet

import pandas as pd
import numpy as np
import polars as pl
import os, warnings, random

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, f1_score, roc_auc_score, classification_report, confusion_matrix)
import xgboost as xgb

warnings.filterwarnings('ignore')

print('✅ All imports successful!')
print(f'Pandas: {pd.__version__}')
print(f'NumPy: {np.__version__}')
print(f'XGBoost: {xgb.__version__}')
