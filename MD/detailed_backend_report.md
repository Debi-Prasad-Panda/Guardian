# Comprehensive Guardian Backend & AI Architecture Report

This document is a deep-dive technical overview of the Guardian Backend. It covers the exact API surface, the data flow, the AI models (the "Three-Tower" architecture), and the intervention (DiCE / Kimi K2.5) layer.

---

## 1. Core Stack & Initialization
- **Framework:** FastAPI (`v4.0.0`) running asynchronously.
- **Database:** MongoDB configured asynchronously (via Motor).
- **WebSockets:** Hosted at `/ws/risk-updates` running an infinite loop calculating and pushing risk deltas every 4 seconds.
- **Boot Process ([main.py](file:///f:/Guardian/server/app/main.py)):** Uses FastAPIs `@asynccontextmanager` lifespan to connect to MongoDB on boot, and dynamically loads the massive ML artifacts (XGBoost models, SentenceTransformers, MLPs) only when the respective service is invoked (`load_towerX()`).

---

## 2. API Surface layer & Routing

### Shipments (`/api/shipments/`)
Provides shipment details, tracking, and interfaces with the ML interpretation engines.
- `GET /` : Returns a list of all shipments (fetched via `motor` async cursor).
- `GET /network` : Retrieves a network propagation graph.
- `GET /{id}` : Native shipment lookup.
- `GET /{id}/shap` : Retrieves SHAP values to explain *why* the shipment has its specific risk score.
- `GET /{id}/timeline` : Generates a historical tracking timeline and horizon-risk forecasts.
- `GET /{id}/dice` : **(Intervention)** Calls [dice_service.py](file:///f:/Guardian/server/app/services/dice_service.py) to calculate counterfactual "what-if" options.
- `GET /{id}/kimi` : **(Intervention)** Calls [kimi_service.py](file:///f:/Guardian/server/app/services/kimi_service.py) to formulate a textual, actionable recommendation.

### Chaos Lab (`/api/chaos/`)
Injects disaster factors onto the live dashboard and estimates shockwaves.
- `GET /presets` : Returns static configurations (e.g., "Suez Canal Blockage", "Monsoon Surge").
- `POST /inject` : Takes `weather_severity`, `port_strike`, and `affected_hub`. It recalculates the base risk of every shipment dynamically by feeding the disaster parameters directly into the **Tower 1 XGBoost model** for a hyper-realistic risk spike, rather than a flat mathematical addition. Then, it uses a predefined `PROPAGATION_GRAPH` to ripple secondary delays.

### Ports (`/api/ports/`)
Used to track logistical nodes.
- `GET /`, `/vessels`, `/kpis` : Exposes congestion KPIs, waiting vessels, and demurrage summaries loaded from DB mapping.

### Machine Learning Direct API (`/api/ml/`)
Exposes the raw backend models.
- `POST /predict` : Direct lookup utilizing the `fused_vector` (885 dims) into Tower 3.
- `POST /predict-shipment` : Full end-to-end pipeline lookup merging db shipment parameters and running through all towers.
- `POST /intervention` : Triggers the complete sequence: DiCE what-if generation -> Kimi analysis -> Cost vs SLA comparison outputs.

### Analytics (`/api/analytics/` & `/api/dashboard/`)
Provides KPI data, dashboard overview, and system metrics.
- `GET /analytics/summary` : Returns full analytics summary with KPIs, model metrics, trends, and benchmarks.
- `GET /dashboard/overview` : Returns dashboard overview with KPIs, alerts, interventions, and heatmap.
- `GET /analytics/graph-summary` : Returns supply-chain graph statistics (vessel count, connections, high-risk nodes).

### External Data (`/api/external/`)
Exposes real-time data from PortWatch, Open-Meteo, and News APIs.
- `GET /live-context` : Combined real-data context for Chaos Injector + Network Ripple.
- `GET /ports/congestion` : Real-time port congestion data from PortWatch (satellite vessel counts).
- `GET /ports/disruptions` : Active GDACS natural disasters and geopolitical events.
- `GET /chokepoints` : Chokepoint status for Suez Canal, Hormuz, and Malacca.
- `GET /weather` : Current weather conditions and severity indices for port cities.
- `GET /news` : Recent logistics and supply chain news headlines with sentiment analysis.

### Settings (`/api/settings/`)
Persists and retrieves user configuration in MongoDB.
- `GET /` : Returns current user settings (risk thresholds, API keys, notification preferences).
- `PUT /` : Updates user settings.

---

## 3. The "Three-Tower" ML Pipeline Deep-Dive

The system's prediction logic runs across 3 separate AI architectures before fusing the predictions to yield a robust, calibrated risk score with uncertainty margins.

### Tower 2: NLP Alert Embeddings ([nlp_service.py](file:///f:/Guardian/server/app/services/nlp_service.py))
- **Engine:** `sentence-transformers/all-MiniLM-L6-v2`.
- **Purpose:** Processes unstructured `alert_text` representing on-ground events (e.g., news about a local strike or a typhoon).
- **Execution:**
    1. Translates the text into a dense **$384$-dimensional** NLP embedding `nlp_embedding`.
    2. Runs the embedding through three separate regressors to score: `labor_strike_probability`, `geopolitical_risk_score`, and `weather_severity_score`.
    3. *Fallback mechanism:* If models fail to load, a rule-based regex fallback matches words like "typhoon" or "strike" and generates default probability arrays.

### Tower 1: Structured Feature Processing ([xgb_service.py](file:///f:/Guardian/server/app/services/xgb_service.py))
- **Engine:** `xgboost` (`xgb_tower1_model.json`).
- **Features:** Takes exactly 13 predictive numerical/categorical vectors:
    - Base parameters: `lead_time`, `carrier_reliability`, `route_delay_rate`, `port_wait_times`, `prediction_horizon_hours` etc.
    - And injests the **outputs coming from Tower 2** (`labor_strike_probability`, etc).
- **Execution:** 
    1. Returns a core `risk_score` (between 0.0 to 1.0 calibrated sigmoid).
    2. Uses XGBoost's `pred_leaf=True` to extract the **structural trajectory of the prediction** yielding a dense vector representations of the decision path. Padded or trimmed to precisely **$500$ dimensions** (`leaf_embeddings`).

### Fusion & Tower 3: Final Synthesis ([fusion_service.py](file:///f:/Guardian/server/app/services/fusion_service.py) & [mlp_service.py](file:///f:/Guardian/server/app/services/mlp_service.py))
- **Engine:** Custom PyTorch MLP ([UncertainMLP](file:///f:/Guardian/server/app/services/mlp_service.py#15-29)).
- **The Vector:** The `fusion_service` merges everything into a strict vector sequence:
    - Dimensions `0 - 499`: XGBoost Leaf Embeddings ($500$). 
    - Dimensions `500 - 883`: NLP MiniLM Embeddings ($384$).
    - Dimension `884`: XGBoost Base Risk Score ($1$).
    - Total Dimension size: $885$.
- **The PyTorch Architecture:** The PyTorch structure is straightforward: 
    - `FC Layer (885 -> 256)` -> `Dropout(p=0.6)` -> `ReLU`
    - `FC Layer (256 -> 64)` -> `Dropout(p=0.6)` -> `ReLU`
    - `FC Layer (64 -> 1)` -> `Sigmoid`
- **Output:** Crucially, the model utilizes inference time properties and the dropout layers to model **MC-Dropout-style Uncertainty**. The output yields:
    - Base `risk_score` (Ex. 0.812)
    - `uncertainty` margin (Ex. ± 0.05)
    - `confidence_label` and interval bounds mapping into a `High/Medium/Monitor` categorization.

---

## 4. The Actionable Intervention Flow
Risk scores are meaningless without actionable resolutions. Guardian implements two components to process mitigation options.

### DiCE Service (Counterfactual Generation)
Located at [dice_service.py](file:///f:/Guardian/server/app/services/dice_service.py). It asks the ML model: *"What minimum features need to change to invert the prediction from High-Risk to Low-Risk?"*
- Loads the Tower 1 XGBoost model natively using the `dice-ml` package.
- Sets continuous features (Things you can alter, like `lead_time`, `port_wait_times` (via expediting customs), or `carrier_reliability`).
- Simulates hypothetical variations (Counterfactuals) constrained by proximity weights (must be easy to change) and diversity weights (giving the user completely different ideas, not 3 variations of changing the carrier).
- Returns the new Risk-Reduction values (e.g., `-40% risk reduction if Port Wait time drops by 20 hrs`).

### Kimi K2.5 Grounding ([kimi_service.py](file:///f:/Guardian/server/app/services/kimi_service.py))
Located at [kimi_service.py](file:///f:/Guardian/server/app/services/kimi_service.py), this acts as the "Virtual Logistics Manager". 
Instead of hallucinating solutions, the LLM is tightly **grounded** to the mathematically proven output of the DiCE engine.
- Takes the DiCE output and formats a strict NLP prompt: `"Here are 3 mathematically proven options: ... Pick the best one considering Cost, SLA, and CO2."`
- **Cost Parsing:** Converts the Kimi-selected option into tangible data, mapping options like "Switch Carrier" into a standardized cost dictionary (`BASE_COSTS["assign_alt_carrier"] == ~Rs. 12,000`).
- **SLA Computation:** Looks at the SLA contract of the specific tier (Priority tier SLA Miss is parameterized at Rs. 75,000 if the penalty hits). The penalty risk is multiplied by the prediction risk model to create an "Expected Cost".
- **Net Output:** Returns a perfectly formatted dictionary contrasting the *Cost of Action* vs. the *Cost of SLA Miss* vs. the *CO2 emissions impact*, serving the Frontend dashboard a quantifiable reason to click "Approve Intervention".
