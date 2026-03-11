

**INNOVATE X 5.0**

AI-Based Early Warning System for Shipment Delays

*Complete Project Blueprint  —  Strategy · Architecture · Docker · Build Plan*

| Version 5  —  Final Build Document 📊 Innovation (40%)   🔧 Tech Complexity (30%)   🎨 Design/UX (20%)   💡 Practical Impact (10%) |
| ----- |

| ✅  Tower 1 XGBoost  AUC 0.8410 | 🔄  Tower 2 MiniLM NLP  — Building | ⏳  Tower 3 MLP Fusion  — Pending | 🐳  Docker Deploy Layer  — NEW v5 |
| :---: | :---: | :---: | :---: |

| 🎯  SECTION 1 — PROBLEM STATEMENT & GOAL What You Are Building and Why It Is Hard |
| :---- |

## **What You Are Building**

An AI-powered early warning system that predicts which shipments are at risk of missing their SLA 48–72 hours in advance, and recommends the most effective intervention to prevent the delay.

| WHY HARD | You are not just predicting a binary outcome. You must handle two completely different data types (structured tabular numbers \+ unstructured text), generate explainable predictions (not a black box), AND recommend a specific, costed action. This is a predictive \+ prescriptive analytics pipeline. |
| :---: | :---- |

## **Scoring Weights**

| Innovation | Tech Complexity | Design / UX | Practical Impact |
| :---- | :---- | :---- | :---- |
| **40%** | **30%** | **20%** | **10%** |

| 🏗️  SECTION 2 — FULL SYSTEM ARCHITECTURE 6-Layer Multimodal Feature Fusion Pipeline |
| :---- |

| NAMING NOTE | We call this a Multimodal Feature Fusion Pipeline — not "Two-Tower" (a recommendation systems term). More accurate, equally impressive, and technically defensible. |
| :---: | :---- |

## **Pipeline Overview**

| \# | Layer | What It Does | Output |
| :---- | :---- | :---- | :---- |
| **1** | Data Ingestion | 5 datasets \+ chaos injection \+ harmonization | \~1.18M rows (394K × 3 horizons) |
| **2** | Feature Engineering | 13 features: lead time, carrier, weather, NLP, ports | Feature matrix ready for models |
| **3** | Tower 1 — XGBoost | Tabular risk prediction \+ leaf embeddings \+ SHAP | risk\_score \+ 500-dim leaf vector |
| **4** | Tower 2 — MiniLM | NLP alerts → 3 risk scores \+ 384-dim embedding | strike\_prob, geo\_risk, weather\_score \+ embedding |
| **5** | Tower 3 — MLP Fusion | Concat leaf(500)+nlp(384)+risk(1) → MLP → MC Dropout | Final probability \+ uncertainty interval |
| **6** | Prescriptive Agent | DiCE counterfactuals → Gemini → action \+ Rs. \+ CO2 | Intervention card per shipment |

## **Layer 2 — Feature Engineering (13 Final Features)**

| Feature | Source | Why It Matters |
| :---- | :---- | :---- |
| **lead\_time** | days\_scheduled | Scheduled lead time — core SLA signal |
| **lead\_time\_horizon\_adjusted** | lead\_time − (horizon\_hours/24) | Time remaining at each prediction horizon |
| **carrier\_reliability** | Computed from TRAIN rows only | Historical carrier on-time rate — 0.148 importance |
| **route\_delay\_rate** | Computed from TRAIN rows only | Historical delay % per origin→dest — 0.324 importance |
| **weather\_severity\_index** | precip×0.4 \+ wind×0.3 \+ extreme×30 | Composite weather signal — 0.228 importance |
| port\_wait\_times | Synthetic injection | Current congestion at key port nodes |
| demurrage\_risk\_flag | port\_wait \> 24hrs | Binary flag for detention risk |
| shipping\_mode\_encoded | Mode → 0/1/2 | Standard/Express/SameDay priority |
| service\_tier\_encoded | Tier → 0/1/2 | Standard/Priority/Critical SLA type |
| prediction\_horizon\_hours | 24 / 48 / 72 | Which time horizon this row represents |
| **news\_sentiment\_score** | Tower 2 MiniLM output | NLP disruption signal from alert text |
| **labor\_strike\_probability** | Tower 2 MiniLM output | Strike risk from news alerts |
| **geopolitical\_risk\_score** | Tower 2 MiniLM output | Macro disruption context from news |

| LEAKAGE WARNING | CRITICAL: NEVER use days\_real as a feature. It is the actual delivery duration — unknown at T-48hrs. Only days\_scheduled is available at prediction time. Both carrier\_reliability and route\_delay\_rate must be computed on training rows only, never on the full dataset before splitting. |
| :---: | :---- |

| 🤖  SECTION 3 — TOWER 2: MiniLM NLP Engine Do NOT Train MiniLM — Import and Use Directly |
| :---- |

| KEY FACT | You do NOT train MiniLM. It is already trained by Microsoft. You import it and use it immediately. The only thing you train is a tiny Ridge regression head on top — which takes under 1 second on 80 examples. |
| :---: | :---- |

## **What MiniLM Is**

MiniLM-L6-v2 is a text-to-numbers converter made by Microsoft (2020). You give it a sentence, it gives back 384 numbers that capture the meaning of that sentence. Similar meanings produce similar numbers. It is 80MB, runs in 8ms per sentence, and requires zero training from you.

| Model | Size | Speed | Domain Fit |
| :---- | :---- | :---- | :---- |
| FinBERT | 438 MB | 200–500ms | SEC filings — WRONG domain |
| BERT-base | 110 MB | 200ms | General — usable |
| **all-MiniLM-L6-v2  ✅ USE THIS** | **80 MB** | **8ms** | **General semantic — best for short alerts** |
| Phi-4 | \~28 GB | OOM on Kaggle | Too large — will crash |
| Kimi K2.5 at inference | API call | 1–3s \+ API dep. | Use offline for labeling only |

## **Kimi K2.5 — Use as Offline Labeler Only**

| PATTERN | Use Kimi K2.5 ONCE offline to generate quality labels for your 80 training examples. Save to CSV. Never call Kimi again during demo. This is the LLM-as-labeler pattern used in production at Snorkel AI. |
| :---: | :---- |

### **Step 1 — Generate Labels with Kimi (Once, Offline)**

from openai import OpenAI

client \= OpenAI(api\_key="YOUR\_KEY", base\_url="https://api.moonshot.cn/v1")

def get\_kimi\_label(alert\_text):

    prompt \= f"""You are a logistics risk analyst.

    Score this alert. Return ONLY valid JSON, no explanation.

    Alert: "{alert\_text}"

    {{"labor\_strike\_probability": 0.0-1.0,

      "geopolitical\_risk\_score": 0.0-1.0,

      "weather\_severity\_score": 0.0-1.0}}"""

    r \= client.chat.completions.create(model="moonshot-v1-8k",

        messages=\[{"role":"user","content":prompt}\], temperature=0.1)

    return json.loads(r.choices\[0\].message.content)

\# Run once, save CSV, never call again

for alert in your\_alerts:

    scores \= get\_kimi\_label(alert)

    writer.writerow(\[alert, scores\["labor\_strike\_probability"\], ...\])

### **Step 2 — Train Ridge Head on MiniLM Embeddings**

from sentence\_transformers import SentenceTransformer

from sklearn.linear\_model import Ridge

\# Import and use — NO training of MiniLM itself

minilm \= SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

\# Load your Kimi-labeled examples

df \= pd.read\_csv("nlp\_training\_labels.csv")

embeddings \= minilm.encode(df\["alert\_text"\].tolist(), normalize\_embeddings=True)

\# Train 3 Ridge regressors — takes \< 1 second total

regressors \= {}

for col in \["labor\_strike\_probability","geopolitical\_risk\_score","weather\_severity\_score"\]:

    reg \= Ridge(alpha=1.0).fit(embeddings, df\[col\].values)

    regressors\[col\] \= reg

    print(f"{col}: trained ✅")

### **Step 3 — Runtime Inference Function**

import streamlit as st

@st.cache\_resource

def load\_tower2():

    model \= SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    with open("tower2\_artifacts.pkl","rb") as f:

        arts \= pickle.load(f)

    return model, arts\["regressors"\]

def get\_nlp\_features(alert\_text: str) \-\> dict:

    minilm, regressors \= load\_tower2()

    try:

        emb \= minilm.encode(\[alert\_text\], normalize\_embeddings=True)\[0\]

        scores \= {k: float(np.clip(r.predict(\[emb\])\[0\],0,1))

                  for k,r in regressors.items()}

        scores\["nlp\_embedding"\] \= emb   \# 384-dim for MLP fusion

        return scores

    except:

        return keyword\_fallback(alert\_text)   \# never crashes

| 🐳  SECTION 4 — DOCKER DEPLOYMENT Build Once on Kaggle. Run Anywhere. Zero Dependency Hell. |
| :---- |

| WHY DOCKER | The biggest demo risk at a hackathon is "it worked on my machine." Docker eliminates this completely. You package your entire pipeline — models, dependencies, Streamlit app — into one container. Run it on any judge laptop, cloud VM, or your own machine without installing anything. |
| :---: | :---- |

## **What Docker Does in This Project**

| Problem Without Docker | Solution With Docker |
| :---- | :---- |
| Python version conflicts (3.9 vs 3.11) | Container pins exact Python 3.10 — always the same |
| XGBoost version mismatch crashes model load | requirements.txt locks all versions in the image |
| MiniLM re-downloads 80MB every run | Model baked into image — instant load |
| Gemini API key exposed in code | Passed as environment variable at runtime |
| Demo machine has no GPU | Container runs fine on CPU — all models are CPU-compatible |
| Judges cannot reproduce results | Anyone can run: docker run \-p 8501:8501 earlywarning |

## **Project Folder Structure**

innovate-x5/

├── Dockerfile                  ← Container definition

├── docker-compose.yml          ← One-command launch

├── requirements.txt            ← All Python dependencies

├── .env                        ← API keys (never commit this)

├── .gitignore                  ← Excludes .env and model files

├── models/

│   ├── xgb\_tower1\_model.json   ← Trained XGBoost

│   ├── tower1\_artifacts.pkl    ← carrier map, route map, features

│   ├── tower2\_artifacts.pkl    ← MiniLM Ridge regressors

│   ├── mapie\_model.pkl         ← Conformal predictor

│   └── calibrated\_model.pkl    ← Platt-scaled XGBoost

├── data/

│   └── sample\_combined.csv     ← 1000-row demo dataset

├── src/

│   ├── app.py                  ← Streamlit entry point

│   ├── tower1.py               ← XGBoost inference functions

│   ├── tower2.py               ← MiniLM inference functions

│   ├── tower3.py               ← MLP fusion \+ MC Dropout

│   ├── innovations.py          ← DiCE, NetworkX, CO2 calculator

│   └── gemini\_agent.py         ← Gemini API \+ fallback handler

└── notebooks/

    └── training\_pipeline.ipynb ← Full Kaggle training notebook

## **The Dockerfile — Full Production-Grade Version**

| EXPLANATION | This Dockerfile uses a multi-stage approach: it pre-downloads MiniLM into the image so the demo never waits for a download. The GEMINI\_API\_KEY is passed at runtime, never hardcoded. |
| :---: | :---- |

\# ── Base image: Python 3.10 slim (smaller than full)

FROM python:3.10-slim

\# ── System dependencies for matplotlib, folium, shapely

RUN apt-get update && apt-get install \-y \\

    gcc g++ libgdal-dev curl git && \\

    rm \-rf /var/lib/apt/lists/\*

\# ── Set working directory

WORKDIR /app

\# ── Copy and install Python dependencies first (layer caching)

COPY requirements.txt .

RUN pip install \--no-cache-dir \-r requirements.txt

\# ── Pre-download MiniLM into the image (runs once at build)

\# This means no 80MB download at demo time

RUN python \-c "from sentence\_transformers import SentenceTransformer; \\

    SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

\# ── Copy application code

COPY src/ ./src/

COPY models/ ./models/

COPY data/ ./data/

\# ── Expose Streamlit port

EXPOSE 8501

\# ── Health check (optional but professional)

HEALTHCHECK CMD curl \--fail http://localhost:8501/\_stcore/health || exit 1

\# ── Launch Streamlit

CMD \["streamlit", "run", "src/app.py",

     "--server.port=8501",

     "--server.address=0.0.0.0",

     "--server.headless=true"\]

## **requirements.txt — Exact Versions**

\# Core ML

xgboost==2.0.3

scikit-learn==1.4.0

sentence-transformers==2.6.1

torch==2.2.0+cpu       \# CPU version — smaller, no CUDA needed for demo

mapie==0.8.3

dice-ml==0.11

shap==0.44.1

\# Data

polars==0.20.6

pandas==2.1.4

numpy==1.26.4

\# API & UI

google-generativeai==0.4.1

streamlit==1.31.1

folium==0.15.1

streamlit-folium==0.18.0

networkx==3.2.1

\# Visualizations

matplotlib==3.8.2

plotly==5.18.0

## **docker-compose.yml — One Command Launch**

\# Run with: docker-compose up

version: "3.8"

services:

  earlywarning:

    build: .

    image: innovatex5-earlywarning:latest

    ports:

      \- "8501:8501"

    env\_file:

      \- .env              \# loads GEMINI\_API\_KEY automatically

    volumes:

      \- ./models:/app/models    \# mount models (no rebuild on model change)

      \- ./data:/app/data

    restart: unless-stopped

    deploy:

      resources:

        limits:

          memory: 4G      \# enough for all models on CPU

## **.env File (Never Commit to Git)**

GEMINI\_API\_KEY=your\_key\_here

KIMI\_API\_KEY=your\_key\_here

APP\_ENV=demo

## **How to Read API Keys Safely in Streamlit**

\# src/gemini\_agent.py

import os

import google.generativeai as genai

def init\_gemini():

    api\_key \= os.getenv("GEMINI\_API\_KEY")

    if not api\_key:

        raise ValueError("GEMINI\_API\_KEY not set in environment")

    genai.configure(api\_key=api\_key)

    return genai.GenerativeModel("gemini-1.5-flash")

## **Complete Docker Workflow: Kaggle → Demo**

| \# | Where | Command / Action |
| :---- | :---- | :---- |
| **1** | Kaggle | Train all towers, save model .pkl and .json files to /kaggle/working/ |
| **2** | Kaggle | Download model files: xgb\_tower1\_model.json, tower1\_artifacts.pkl, tower2\_artifacts.pkl, mapie\_model.pkl, calibrated\_model.pkl |
| **3** | Your machine | Place downloaded files in innovate-x5/models/ folder |
| **4** | Your machine | echo "GEMINI\_API\_KEY=your\_key" \> .env |
| **5** | Your machine | docker-compose up \--build |
| **6** | Any browser | Open http://localhost:8501 — app is running |
| **7** | Demo day | docker save innovatex5-earlywarning:latest | gzip \> demo.tar.gz  — share with anyone |

## **What to Tell Judges About Docker**

| PITCH LINE | "Our system is fully containerised. Any judge can run it with two commands — docker-compose up — on any machine with Docker installed, without installing Python, without dependency conflicts, without API keys exposed. The MiniLM model is baked into the image so there is no network dependency at demo time." |
| :---: | :---- |

| 💡  SECTION 5 — INNOVATION FEATURES Four Features No Other Team Will Have — 40% of Your Marks |
| :---- |

## **Innovation 1 — Risk Propagation Graph (NetworkX)**

| HONEST FRAMING | Do NOT claim this is what Amazon uses (ST-GNNs require learned attention). Call it "simplified risk propagation using the same topological principle as Spatio-Temporal GNNs but with static decay." Every word is true and defensible. |
| :---: | :---- |

import networkx as nx

G \= nx.DiGraph()

G.add\_edge("SHP\_001","SHP\_047", weight=0.6)  \# same carrier

def ripple\_risk(G, source\_node, base\_risk):

    for neighbor in G.neighbors(source\_node):

        w \= G\[source\_node\]\[neighbor\]\["weight"\]

        propagated \= base\_risk \* w \* 0.7   \# decay factor

        G.nodes\[neighbor\]\["risk"\] \= max(

            G.nodes\[neighbor\].get("risk", 0), propagated)

## **Innovation 2 — DiCE Counterfactuals \+ Gemini**

For each flagged shipment, DiCE generates 3 what-if scenarios that would bring risk below threshold. These counterfactuals are fed directly into the Gemini prompt — grounding every recommendation in verified mathematics.

import dice\_ml

d \= dice\_ml.Data(dataframe=train\_df,

    continuous\_features=\["weather\_severity","lead\_time"\],

    outcome\_name="Late\_delivery\_risk")

m \= dice\_ml.Model(model=xgb\_model, backend="sklearn")

exp \= dice\_ml.Dice(d, m)

cf \= exp.generate\_counterfactuals(instance, total\_CFs=3, desired\_class="opposite")

## **Innovation 3 — MC Dropout Uncertainty Quantification**

class UncertainMLP(nn.Module):

    def \_\_init\_\_(self):

        super().\_\_init\_\_()

        self.fc1 \= nn.Linear(885, 256\)

        self.dropout \= nn.Dropout(p=0.3)  \# KEEP ON at inference

        self.fc2 \= nn.Linear(256, 64\)

        self.fc3 \= nn.Linear(64, 1\)

model.train()  \# keep dropout active

preds \= \[model(tensor) for \_ in range(50)\]

mean\_risk \= torch.stack(preds).mean()

uncertainty \= torch.stack(preds).std()

\# Output: Risk: 78% ± 6%  (High Confidence)

## **Innovation 4 — Multi-Horizon Timeline**

Call the same model 3 times per shipment with horizon=24/48/72. Display as a sparkline row. Risk acceleration tells you to intervene today, not tomorrow.

for horizon in \[24, 48, 72\]:

    row\["prediction\_horizon\_hours"\] \= horizon

    row\["lead\_time\_horizon\_adjusted"\] \= row\["lead\_time"\] \- (horizon/24)

    risk\[horizon\] \= calibrated\_model.predict\_proba(\[row\])\[0\]\[1\]

\# SHP\_001: T+24: 31%  T+48: 68%  T+72: 87% → INTERVENE NOW

| ✅  SECTION 6 — COMPLETE PROJECT BUILD CHECKLIST Work Through Phases Sequentially. Priority 1 \= Demo Fails If Skipped. |
| :---- |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **⚙️  PHASE 0 — ENVIRONMENT** |  |  |  |
| **✅ DONE** | **polars, xgboost, shap, mapie, dice-ml installed** | Kaggle notebook | **1** |
| **⬜ TODO** | **pip install sentence-transformers** | Tower 2 | **1** |
| **⬜ TODO** | **Get Gemini API key (aistudio.google.com)** | Tower 3 agent | **1** |
| **⬜ TODO** | **Get Kimi API key (moonshot.cn)** | NLP labeling | **1** |
| **⬜ TODO** | **Install Docker Desktop on demo machine** | Deployment | **1** |
| **⬜ TODO** | **Test Gemini API returns valid JSON before building** | Catch failures early | **1** |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **✅  PHASE 1 — TOWER 1: XGBoost (COMPLETE)** |  |  |  |
| **✅ DONE** | **5 datasets loaded and harmonized** | \~394K base rows | **1** |
| **✅ DONE** | **Probabilistic chaos injection 85/15** | No shortcut overfitting | **1** |
| **✅ DONE** | **carrier\_reliability from train rows only** | Run 3 fix | **1** |
| **✅ DONE** | **route\_delay\_rate from train rows only** | Run 4 fix — AUC 0.8410 | **1** |
| **✅ DONE** | **data\_source removed from features** | Run 3 fix | **1** |
| **✅ DONE** | **Multi-horizon ×3 expansion (1.18M rows)** | T+24/48/72 | **1** |
| **✅ DONE** | **XGBoost trained with scale\_pos\_weight** | Class imbalance handled | **1** |
| **✅ DONE** | **Platt scaling calibration** | Trustworthy probabilities | **1** |
| **✅ DONE** | **MAPIE conformal prediction** | 90% coverage intervals | **1** |
| **✅ DONE** | **SHAP explainability ready** | get\_shap\_explanation() | **1** |
| **✅ DONE** | **predict\_for\_fusion() handoff function** | leaf(500) \+ risk(1) | **1** |
| **✅ DONE** | **All artifacts saved to /kaggle/working/** | 5 files saved | **1** |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **🔄  PHASE 2 — TOWER 2: MiniLM NLP (BUILD NOW)** |  |  |  |
| **⬜ TODO** | **Write 80+ labeled alert examples (Cell B1)** | LOGISTICS\_ALERTS list | **1** |
| **⬜ TODO** | **Call Kimi once to generate/verify labels** | nlp\_training\_labels.csv | **1** |
| **⬜ TODO** | **pip install sentence-transformers** | Library ready | **1** |
| **⬜ TODO** | **Load MiniLM and encode all examples** | (N, 384\) matrix | **1** |
| **⬜ TODO** | **Train 3 Ridge regression heads** | \< 1 second training | **1** |
| **⬜ TODO** | **Cross-validate: R² ≥ 0.75 on all 3 scores** | Proves model works | **1** |
| **⬜ TODO** | **Validate on 4 unseen test alerts** | Direction must be correct | **1** |
| **⬜ TODO** | **Build keyword\_fallback() safety net** | Never crashes demo | **1** |
| **⬜ TODO** | **Build get\_nlp\_features() function** | Returns scores \+ embedding | **1** |
| **⬜ TODO** | **Add @st.cache\_resource for MiniLM** | No reload per request | **1** |
| **⬜ TODO** | **Save tower2\_artifacts.pkl** | regressors \+ names | **1** |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **⏳  PHASE 3 — TOWER 3: MLP Fusion (PyTorch)** |  |  |  |
| **⬜ TODO** | **Build UncertainMLP class with Dropout(0.3)** | 885→256→64→1 arch | **1** |
| **⬜ TODO** | **Concat leaf(500)+nlp(384)+risk(1) → 885-dim** | Fused input tensor | **1** |
| **⬜ TODO** | **Train MLP 20 epochs BCELoss \+ Adam** | model.pth saved | **1** |
| **⬜ TODO** | **MC Dropout 50 passes at inference** | mean ± std output | **1** |
| **⬜ TODO** | **Verify uncertainty varies by confidence** | 87%±5% vs 63%±19% | **1** |
| **⬜ TODO** | **Save mlp\_model.pth** | torch.save(state\_dict) | **1** |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **⏳  PHASE 4 — INNOVATIONS** |  |  |  |
| **⬜ TODO** | **NetworkX Ripple Effect Graph** | DiGraph \+ ripple\_risk() | **1** |
| **⬜ TODO** | **Batch Disruption Mode (whole map re-evaluates)** | Biggest demo moment | **1** |
| **⬜ TODO** | **Test DiCE on 1K-row sample FIRST** | Catch failures early | **1** |
| **⬜ TODO** | **DiCE counterfactuals → 3 options per shipment** | desired\_class=opposite | **1** |
| **⬜ TODO** | **Feed DiCE output into Gemini prompt** | Eliminates hallucination | **1** |
| **⬜ TODO** | **Gemini JSON fallback handler (try/except)** | Demo never crashes | **1** |
| **⬜ TODO** | **Dynamic surge costing** | base × severity multiplier | **2** |
| **⬜ TODO** | **CO2 impact calculator (Rail/Road/Sea/Air)** | ESG differentiator | **2** |
| **⬜ TODO** | **Carrier acceptance rate filter** | acceptance≥0.70 \+ load\<0.85 | **2** |
| **⬜ TODO** | **Tiered thresholds (Critical/Priority/Standard)** | 0.10/0.14/0.25 | **2** |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **⏳  PHASE 5 — DOCKER DEPLOYMENT (NEW IN v5)** |  |  |  |
| **⬜ TODO** | **Create project folder structure (src/models/data)** | Clean repo layout | **1** |
| **⬜ TODO** | **Write Dockerfile (Python 3.10-slim \+ MiniLM bake-in)** | Container definition | **1** |
| **⬜ TODO** | **Write requirements.txt with pinned versions** | Reproducible deps | **1** |
| **⬜ TODO** | **Write docker-compose.yml** | One-command launch | **1** |
| **⬜ TODO** | **Create .env file with API keys** | GEMINI\_API\_KEY etc. | **1** |
| **⬜ TODO** | **Add .env and model files to .gitignore** | Security hygiene | **1** |
| **⬜ TODO** | **Download trained model files from Kaggle** | 5 artifact files | **1** |
| **⬜ TODO** | **Run: docker-compose up \--build** | First successful build | **1** |
| **⬜ TODO** | **Test app at localhost:8501** | Full smoke test | **1** |
| **⬜ TODO** | **Export: docker save | gzip \> demo.tar.gz** | Portable image | **2** |
| **⬜ TODO** | **Test image loads and runs from .tar.gz** | Verify portability | **2** |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **⏳  PHASE 6 — STREAMLIT DASHBOARD** |  |  |  |
| **⬜ TODO** | **Folium map with tiered color markers** | Green/Yellow/Red by threshold | **1** |
| **⬜ TODO** | **Chaos Injector sliders (weather \+ port strike)** | Triggers batch re-evaluation | **1** |
| **⬜ TODO** | **SHAP waterfall chart per shipment** | Explains WHY flagged | **1** |
| **⬜ TODO** | **Intervention card (action \+ Rs. \+ CO2)** | Gemini \+ DiCE output | **1** |
| **⬜ TODO** | **Human Override button (Accept/Override)** | Logs to outcome table | **1** |
| **⬜ TODO** | **Saved Today counter (running Rs. total)** | Sum of net\_saving | **1** |
| **⬜ TODO** | **Multi-horizon sparkline per shipment** | T+24→T+48→T+72 | **2** |
| **⬜ TODO** | **MC Dropout confidence badge** | Low/Medium/High visual | **2** |
| **⬜ TODO** | **Tab 2: Port Congestion Dashboard** | Maersk-style framing | **2** |
| **⬜ TODO** | **Model Card expander (AUC/F1/rows)** | Transparency for judges | **2** |

| STATUS | TASK | OUTPUT | PRI |
| ----- | :---- | :---- | ----- |
| **⏳  PHASE 7 — DEMO PREP** |  |  |  |
| **⬜ TODO** | **Prepare ONE end-to-end shipment story** | Risk 12%→87% across checkpoints | **1** |
| **⬜ TODO** | **Rehearse Chaos Injector → Batch Disruption moment** | Map goes red → ripple spreads | **1** |
| **⬜ TODO** | **Suez Canal pre-canned scenario ready** | Historical case study | **1** |
| **⬜ TODO** | **Rehearse outcome loop pitch script** | "System learns from every intervention" | **1** |
| **⬜ TODO** | **Test all offline fallbacks (no WiFi)** | Gemini \+ MiniLM both have fallbacks | **1** |
| **⬜ TODO** | **Confirm demo runs from Docker, not Kaggle** | No Kaggle login needed | **1** |
| **⬜ TODO** | **Prepare judge Q\&A answers (leaf indices, MiniLM)** | See Section 7 below | **2** |

| 🎤  SECTION 7 — JUDGE Q\&A PREPARATION Word-for-Word Answers to the Hardest Questions |
| :---- |

| Judge Asks | You Say |
| :---- | :---- |
| XGBoost does not produce embeddings — what did you use? | We extract leaf node indices via xgb\_model.apply(). Each of 500 trees returns one integer — which decision path fired. This 500-dim vector captures the model's internal routing logic and fuses well with the MiniLM semantic embedding. |
| Why MiniLM and not FinBERT? | FinBERT was pre-trained on SEC filings — wrong domain. MiniLM-L6 gives better semantic coverage for short logistics alerts, is 25x faster, and we fine-tuned a Ridge head on Kimi-labeled logistics scenarios for domain-specific outputs. |
| Your AUC dropped from 0.99 to 0.84 — did your model get worse? | We identified and corrected two data leakage issues. The 0.84 AUC is the honest result on a leakage-free version of the task. We proactively fixed it — which is more impressive than presenting inflated numbers. |
| Why Docker? | Reproducibility and demo reliability. Any judge can run the full system with docker-compose up — no Python install, no dependency conflicts, no API keys in code. MiniLM is baked into the image so there is zero network dependency at demo time. |
| Is this what real logistics companies use? | DHL's Smart ETA uses gradient-boosted trees for delay prediction. Maersk uses port congestion dashboards. Our ripple propagation follows the same topological principle as Spatio-Temporal GNNs used by FedEx, with static propagation rather than learned attention — appropriate for a 30-hour build. |

*INNOVATE X 5.0  |  Complete Blueprint v5  |  Build to Win*