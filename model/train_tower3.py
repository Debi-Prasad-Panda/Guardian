# model/train_tower3.py
# Tower 3: MLP Fusion Head + MC Dropout Uncertainty
# Input:  885-dim fused vector (500 XGB leaf + 384 MiniLM + 1 risk score)
# Output: final_risk_score ± neural_uncertainty
# Time:   ~30 minutes to run on CPU

import numpy as np
import pandas as pd
import pickle
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import roc_auc_score, f1_score, accuracy_score
from sklearn.model_selection import train_test_split
import os, sys

# ── PATHS ─────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XGB_PATH   = os.path.join(BASE_DIR, "model", "XG Boost (Tower 1)", "models", "tower1_artifacts.pkl")
T2_PATH    = os.path.join(BASE_DIR, "server", "models", "tower2_artifacts.pkl")
DATA_PATH  = os.path.join(BASE_DIR, "model", "XG Boost (Tower 1)", "models", "sample_combined.csv")
SAVE_PATH  = os.path.join(BASE_DIR, "server", "models", "tower3_mlp.pth")
META_PATH  = os.path.join(BASE_DIR, "server", "models", "tower3_meta.pkl")

# ── ARCHITECTURE ──────────────────────────────────────────────────
INPUT_DIM  = 885   # 500 XGB leaf + 384 MiniLM + 1 calibrated risk score
HIDDEN1    = 256
HIDDEN2    = 64
DROPOUT_P  = 0.3
MC_PASSES  = 50    # stochastic forward passes at inference

# ─────────────────────────────────────────────────────────────────
# MODEL DEFINITION
# ─────────────────────────────────────────────────────────────────
class UncertainMLP(nn.Module):
    """
    3-layer MLP with MC Dropout for epistemic uncertainty quantification.
    Dropout stays ACTIVE at inference (model.train() mode).
    """
    def __init__(self, input_dim=INPUT_DIM, h1=HIDDEN1, h2=HIDDEN2, p=DROPOUT_P):
        super().__init__()
        self.fc1     = nn.Linear(input_dim, h1)
        self.bn1     = nn.BatchNorm1d(h1)
        self.drop1   = nn.Dropout(p=p)
        self.fc2     = nn.Linear(h1, h2)
        self.bn1     = nn.BatchNorm1d(h1)
        self.drop2   = nn.Dropout(p=p)
        self.out     = nn.Linear(h2, 1)

    def forward(self, x):
        x = self.drop1(F.relu(self.fc1(x)))
        x = self.drop2(F.relu(self.fc2(x)))
        return torch.sigmoid(self.out(x))


# ─────────────────────────────────────────────────────────────────
# FUSION VECTOR BUILDER
# ─────────────────────────────────────────────────────────────────
def build_fusion_vectors(df, xgb_model, minilm, regressors,
                          calibrated_model, feature_cols, alert_col="alert_text"):
    """
    For each row in df, build the 885-dim fusion vector.
    Returns: np.array shape (N, 885), np.array labels shape (N,)
    """
    from sentence_transformers import SentenceTransformer
    import numpy as np

    print(f"Building fusion vectors for {len(df)} rows...")
    X_fused = []
    
    # Unique alerts only — encode once, map back (speed optimisation)
    unique_alerts = df[alert_col].fillna("no alert").unique().tolist()
    print(f"  Encoding {len(unique_alerts)} unique alerts with MiniLM...")
    unique_embs = minilm.encode(unique_alerts, normalize_embeddings=True,
                                 show_progress_bar=True)
    alert_to_emb = {a: e for a, e in zip(unique_alerts, unique_embs)}

    for i, (_, row) in enumerate(df.iterrows()):
        if i % 50000 == 0:
            print(f"  Processing row {i}/{len(df)}...")

        # ── Tower 1: XGBoost leaf embeddings (500-dim) ───────────
        feat_row = row[feature_cols].values.reshape(1, -1)
        feat_df = pd.DataFrame(feat_row, columns=feature_cols, dtype=np.float32)
        leaf_emb = xgb_model.apply(feat_df)[0].astype(np.float32)  # (500,)

        # ── Tower 1: calibrated risk score (1-dim) ────────────────
        risk_score = np.array(
            [calibrated_model.predict_proba(feat_df)[0][1]], dtype=np.float32
        )

        # ── Tower 2: MiniLM NLP embedding (384-dim) ───────────────
        alert_text = row.get(alert_col, "no alert")
        nlp_emb = alert_to_emb.get(str(alert_text),
                                    np.zeros(384, dtype=np.float32))

        # ── Concatenate → 885-dim ─────────────────────────────────
        fused = np.concatenate([leaf_emb, nlp_emb.astype(np.float32), risk_score])
        X_fused.append(fused)

    return np.array(X_fused, dtype=np.float32)


# ─────────────────────────────────────────────────────────────────
# MC DROPOUT INFERENCE
# ─────────────────────────────────────────────────────────────────
def predict_with_uncertainty(model, x_tensor, n_passes=MC_PASSES):
    """
    Run N stochastic forward passes with dropout active.
    Returns mean risk score and std (uncertainty).
    """
    model.train()  # CRITICAL: keeps dropout active
    with torch.no_grad():
        preds = torch.stack([model(x_tensor) for _ in range(n_passes)])
    mean = preds.mean(dim=0).squeeze().item()
    std  = preds.std(dim=0).squeeze().item()
    return mean, std


# ─────────────────────────────────────────────────────────────────
# MAIN TRAINING SCRIPT
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    # ── 1. LOAD ARTIFACTS ─────────────────────────────────────────
    print("\n1. Loading Tower 1 + Tower 2 artifacts...")

    with open(XGB_PATH, "rb") as f:
        xgb_artifacts = pickle.load(f)

    import xgboost as xgb
    xgb_model = xgb.XGBClassifier()
    xgb_model.load_model(os.path.join(BASE_DIR, "model", "XG Boost (Tower 1)", "models", "xgb_tower1_model.json"))
    
    calibrated_model = xgb_model
    feature_cols = xgb_model.get_booster().feature_names

    with open(T2_PATH, "rb") as f:
        t2 = pickle.load(f)
    regressors = t2["regressors"]

    from sentence_transformers import SentenceTransformer
    minilm = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("✅ All artifacts loaded")

    # ── 2. LOAD TRAINING DATA ─────────────────────────────────────
    print(f"\n2. Loading training data from {DATA_PATH}...")
    if DATA_PATH.endswith(".csv"):
        import pandas as pd
        train_data = pd.read_csv(DATA_PATH)
    else:
        with open(DATA_PATH, "rb") as f:
            train_data = pickle.load(f)

    # Accepts dict with df + labels, or direct dataframe
    if isinstance(train_data, dict):
        df = train_data["df"]
        y  = train_data["labels"].values if hasattr(train_data["labels"], "values") \
             else np.array(train_data["labels"])
    else:
        df = train_data
        y  = df["target"].values

    # If dataset is huge, sample for MLP training (XGB already trained on full)
    MAX_ROWS = 200_000
    if len(df) > MAX_ROWS:
        print(f"  Sampling {MAX_ROWS} rows from {len(df)} for MLP training speed...")
        idx = np.random.choice(len(df), MAX_ROWS, replace=False)
        df  = df.iloc[idx].reset_index(drop=True)
        y   = y[idx]

    print(f"  Training rows: {len(df)}")

    # Add NLP columns if missing (needed for feature_cols)
    if "alert_text" not in df.columns:
        df["alert_text"] = "no alert"
    if "labor_strike_probability" not in df.columns:
        df["labor_strike_probability"] = 0.05
    if "geopolitical_risk_score" not in df.columns:
        df["geopolitical_risk_score"]  = 0.05
    if "weather_severity_score" not in df.columns:
        df["weather_severity_score"]   = 0.05

    # Reconstruct Tower 1 derived features if missing
    if "prediction_horizon_hours" not in df.columns:
        df["prediction_horizon_hours"] = 24.0
    if "lead_time_horizon_adjusted" not in df.columns:
        df["lead_time_horizon_adjusted"] = df.get("lead_time", 10.0) - (df["prediction_horizon_hours"] / 24.0)

    c_map = xgb_artifacts.get("carrier_reliability_map", {})
    r_map = xgb_artifacts.get("route_delay_map", {})
    
    if "carrier_reliability" not in df.columns:
        if "carrier" in df.columns:
            df["carrier_reliability"] = df["carrier"].map(c_map).fillna(0.85)
        else:
            df["carrier_reliability"] = 0.85
            
    if "route_delay_rate" not in df.columns:
        if "origin_city" in df.columns and "dest_city" in df.columns:
            df["route_delay_rate"] = df.apply(lambda r: r_map.get(f"{r.get('origin_city','')}_{r.get('dest_city','')}", 0.15), axis=1)
        else:
            df["route_delay_rate"] = 0.15

    if "weather_severity_index" not in df.columns and "weather_severity_score" in df.columns:
        df["weather_severity_index"] = df["weather_severity_score"]

    # Defensive fill and typecast for any feature expected by XGBoost
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0.0
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0).astype(float)

    # ── 3. BUILD FUSION VECTORS ───────────────────────────────────
    print("\n3. Building 885-dim fusion vectors...")
    X_fused = build_fusion_vectors(
        df, xgb_model, minilm, regressors,
        calibrated_model, feature_cols
    )
    print(f"  Fusion matrix shape: {X_fused.shape}")  # (N, 885)

    # ── 4. TRAIN / VAL SPLIT ──────────────────────────────────────
    X_train, X_val, y_train, y_val = train_test_split(
        X_fused, y, test_size=0.15, random_state=42, stratify=y
    )

    # Convert to tensors
    X_tr = torch.FloatTensor(X_train)
    y_tr = torch.FloatTensor(y_train).unsqueeze(1)
    X_vl = torch.FloatTensor(X_val)
    y_vl = torch.FloatTensor(y_val).unsqueeze(1)

    train_loader = DataLoader(
        TensorDataset(X_tr, y_tr),
        batch_size=512, shuffle=True
    )

    # ── 5. TRAIN MLP ──────────────────────────────────────────────
    print("\n4. Training UncertainMLP...")

    model     = UncertainMLP()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, patience=3, factor=0.5
    )

    # Class imbalance weight
    pos_weight = torch.tensor([(y_train == 0).sum() / (y_train == 1).sum()])
    criterion  = nn.BCELoss()

    EPOCHS     = 30
    best_auc   = 0.0
    best_state = None
    patience   = 0
    MAX_PATIENCE = 6

    for epoch in range(1, EPOCHS + 1):
        # Training
        model.train()
        train_loss = 0.0
        for xb, yb in train_loader:
            optimizer.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        # Validation
        model.eval()
        with torch.no_grad():
            val_pred  = model(X_vl).squeeze().numpy()
        val_auc = roc_auc_score(y_val, val_pred)
        val_f1  = f1_score(y_val, (val_pred > 0.5).astype(int))
        scheduler.step(1 - val_auc)

        print(f"  Epoch {epoch:02d} | loss={train_loss/len(train_loader):.4f} "
              f"| val_AUC={val_auc:.4f} | val_F1={val_f1:.4f}")

        if val_auc > best_auc:
            best_auc   = val_auc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience   = 0
        else:
            patience += 1
            if patience >= MAX_PATIENCE:
                print(f"  Early stopping at epoch {epoch}")
                break

    # ── 6. LOAD BEST WEIGHTS ──────────────────────────────────────
    model.load_state_dict(best_state)
    print(f"\n✅ Best val AUC: {best_auc:.4f}")

    # ── 7. FINAL EVALUATION ───────────────────────────────────────
    print("\n5. Final evaluation...")
    model.eval()
    with torch.no_grad():
        final_preds = model(X_vl).squeeze().numpy()

    final_auc = roc_auc_score(y_val, final_preds)
    final_f1  = f1_score(y_val, (final_preds > 0.5).astype(int))
    final_acc = accuracy_score(y_val, (final_preds > 0.5).astype(int))

    print(f"  AUC-ROC:  {final_auc:.4f}")
    print(f"  F1 Score: {final_f1:.4f}")
    print(f"  Accuracy: {final_acc:.4f}")

    # ── 8. MC DROPOUT TEST ────────────────────────────────────────
    print("\n6. MC Dropout uncertainty test (3 sample shipments)...")
    sample_rows = [0, len(X_val)//2, -1]
    for idx in sample_rows:
        x_single = torch.FloatTensor(X_val[idx]).unsqueeze(0)
        mean, std = predict_with_uncertainty(model, x_single)
        conf = "High confidence" if std < 0.08 else \
               "Medium confidence" if std < 0.15 else "Monitor closely"
        true_label = "LATE" if y_val[idx] == 1 else "ON TIME"
        print(f"  Sample {idx}: Risk={mean:.0%} ± {std:.0%} ({conf}) | True: {true_label}")

    # ── 9. SAVE ───────────────────────────────────────────────────
    print("\n7. Saving Tower 3 artifacts...")
    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

    torch.save(best_state, SAVE_PATH)

    meta = {
        "input_dim":    INPUT_DIM,
        "hidden1":      HIDDEN1,
        "hidden2":      HIDDEN2,
        "dropout_p":    DROPOUT_P,
        "mc_passes":    MC_PASSES,
        "feature_cols": feature_cols,
        "best_val_auc": best_auc,
        "final_f1":     final_f1,
        "architecture": "UncertainMLP: 885→256→64→1 + BatchNorm + Dropout(0.3)",
    }
    with open(META_PATH, "wb") as f:
        pickle.dump(meta, f)

    print(f"✅ Model saved:    {SAVE_PATH}")
    print(f"✅ Metadata saved: {META_PATH}")
    print(f"\n🎯 Tower 3 complete — ready for Innovations (DiCE, NetworkX, Gemini)!")
