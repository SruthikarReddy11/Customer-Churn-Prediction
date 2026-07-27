# Customer Churn Prediction & Customer Lifetime Value (LTV) Engine

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95%2B-009688?logo=fastapi)
![HTML5/CSS3/JS](https://img.shields.io/badge/Web%20Dashboard-HTML5%2FCSS3%2FJS-E34F26?logo=html5)
![Chart.js](https://img.shields.io/badge/Chart.js-Visualization-FF6384?logo=chartdotjs)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.2%2B-F7931E?logo=scikit-learn)
![XGBoost](https://img.shields.io/badge/XGBoost-1.7%2B-2A52BE)
![SHAP](https://img.shields.io/badge/SHAP-Explainability-brightgreen)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![License](https://img.shields.io/badge/License-MIT-green)

An enterprise-grade, production-ready Machine Learning and Business Intelligence platform built on the **IBM Telco Customer Churn** dataset. This system delivers real-time churn risk scoring, customer lifetime value (LTV) prediction, model explainability via SHAP, a FastAPI backend microservice, and an interactive HTML5/CSS3/JS executive web dashboard.

---

## Business Problem & Impact

Customer acquisition in telecommunications costs **5x to 25x** more than customer retention. A **5% reduction in churn** can increase operating profits by **25% to 95%**. 

### Strategic Objectives
1. **Identify At-Risk Customers**: Predict churn with high accuracy ($\text{ROC-AUC} \ge 0.84$) prior to service termination.
2. **Quantify Financial Leakage**: Estimate Monthly Recurring Revenue (MRR) at risk and compute Customer Lifetime Value (LTV).
3. **Explain Driver Attribution**: Provide interpretable SHAP feature contributions for personalized retention offers.
4. **Deploy Real-Time Microservice**: Expose scalable FastAPI REST endpoints for CRM integration.
5. **Interactive Executive Web Dashboard**: Provide real-time data visual analytics, multi-filtering, and live risk scoring via HTML/CSS/JS.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Core Language** | Python 3.10+ |
| **Front-End Dashboard** | HTML5, Vanilla CSS3 (Dark Glassmorphism UI), JavaScript (ES6+), Chart.js |
| **Data Processing & EDA** | Pandas, NumPy, Matplotlib, Seaborn |
| **Machine Learning** | Scikit-Learn, XGBoost |
| **Model Explainability** | SHAP (SHapley Additive exPlanations) |
| **Database & SQL** | MySQL 8.0 DDL/DML, Relational Schema |
| **Backend Framework** | FastAPI, Uvicorn, Pydantic V2 |
| **Testing & Tooling** | Pytest, Git, Jupyter Notebook |

---

## Enterprise Directory Structure

```
Customer_Churn/
│
├── dashboard/
│   ├── index.html                     # Main HTML5 Executive Dashboard application
│   ├── styles.css                     # Dark glassmorphism CSS design system
│   ├── app.js                         # JavaScript logic (Chart.js, filters, API client)
│   └── Web_Dashboard_Guide.md         # Front-end architecture & setup guide
├── data_raw/
│   └── WA_Fn-UseC_-Telco-Customer-Churn.csv # IBM Telco raw dataset
├── data_processed/
│   ├── cleaned_churn_data.csv         # Cleansed dataset (0 missing, 0 duplicates)
│   ├── features_churn_data.csv        # Engineered features & LTV dataset
│   └── train_test_data.pkl            # Preprocessed train/test data bundle
├── docs/
│   └── business_understanding.md      # Problem statement, objectives & KPIs
├── external/                          # External specifications
├── models/
│   ├── best_churn_model.pkl           # Saved Logistic Regression / XGBoost model
│   ├── ltv_model.pkl                  # Saved XGBoost LTV Regressor model
│   ├── encoder.pkl                    # Saved ColumnTransformer (Scaler + OneHotEncoder)
│   └── metrics.json                   # Serialized model performance metrics
├── notebooks/
│   ├── 01_Data_Loading.ipynb          # Data loading & integrity checks
│   ├── 02_Data_Cleaning.ipynb         # Data type coercions & null handling
│   ├── 03_EDA.ipynb                   # Univariate, bivariate & correlation analysis
│   ├── 04_Feature_Engineering.ipynb   # Feature creation, encoding, scaling & split
│   └── 05_Model_Building.ipynb        # Model training, comparison & SHAP
├── reports/
│   └── figures/                       # High-resolution exported charts & SHAP plots
│       ├── 01_churn_distribution.png
│       ├── 02_churn_by_contract.png
│       ├── 03_tenure_monthlycharges_kde.png
│       ├── 04_correlation_heatmap.png
│       ├── 05_feature_importance.png
│       ├── 06_shap_summary.png
│       └── 07_shap_bar_importance.png
├── sql/
│   ├── 01_schema.sql                  # MySQL database DDL schema
│   ├── 02_data_import.sql             # SQL data loading & staging script
│   ├── 03_churn_analysis.sql          # SQL business analytics queries
│   └── 04_insights.md                 # SQL analytical conclusions & recommendations
├── src/
│   ├── api/
│   │   ├── app.py                     # FastAPI application entry point
│   │   ├── routes.py                  # Endpoint handlers (/predict-churn, /predict-ltv)
│   │   └── schemas.py                 # Pydantic input validation & response schemas
│   ├── cleaner.py                     # Data cleaning pipeline
│   ├── config.py                      # Centralized configuration & paths
│   ├── data_loader.py                 # Raw dataset loader
│   ├── eda.py                         # Automated EDA & plot exporter
│   ├── explainability.py              # SHAP & Feature Importance generator
│   ├── feature_engineering.py         # Domain feature builder & standardizer
│   ├── logger.py                      # Logging configuration module
│   ├── model_trainer.py               # Model training & metrics evaluation
│   └── utils.py                       # Helper utilities & LTV equations
├── tests/
│   └── test_pipeline.py               # Pytest suite (100% pass rate)
├── README.md                          # Production README
├── requirements.txt                   # Pinned dependency requirements
└── run_pipeline.py                    # End-to-end pipeline execution runner
```

---

## Phase Breakdown & Key Results

### Phase 1: Business Understanding
- Quantified baseline churn (**26.54%**) and monthly recurring revenue loss (**$139,130.85/mo**).
- Defined primary evaluation metric: **ROC-AUC** & **F1 Score** to balance precision and recall.

### Phase 2: SQL Database Architecture & Analytics
- Designed a normalized MySQL database schema (`customers`, `customer_services`, `billing_info`) with foreign key constraints and performance indexing.
- Key SQL finding: **Month-to-Month contract holders represent 88.55% of all churned customers**, while Fiber Optic users without Tech Support churn at **41.89%**.

### Phase 3 & 4: Python EDA & Feature Engineering
- **Cleaning**: Coerced missing whitespace values in `TotalCharges` ($N=11$) to tenure-adjusted monthly charges. Removed all duplicate records.
- **Engineered Features**:
  - `TenureGroup`: Lifecycle cohort (0-1 Year, 1-2 Years, 2-4 Years, 4+ Years).
  - `TotalServices`: Active subscription count across 8 service add-ons.
  - `ContractRiskScore`: Numeric ordinal risk weighting (Month-to-Month = 3, 1-Year = 2, 2-Year = 1).
  - `Historical_LTV`: Accumulated lifetime revenue ($\text{MonthlyCharges} \times \text{Tenure}$).

### Phase 5: Machine Learning Model Comparison

All models were evaluated on an independent 20% stratified test set ($N=1,409$):

| Model Name | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression (Best)** | **0.8034** | **0.6622** | **0.5241** | **0.5859** | **0.8460** |
| **Random Forest** | 0.8034 | 0.6713 | 0.5187 | 0.5835 | 0.8442 |
| **XGBoost Classifier** | 0.7984 | 0.6438 | 0.5294 | 0.5824 | 0.8437 |
| **Decision Tree** | 0.7942 | 0.6385 | 0.5027 | 0.5646 | 0.8278 |
| **LTV Regressor (XGBoost)** | -- | -- | -- | -- | **RMSE: $54.20, R^2: 0.9994** |

---

### Phase 6: Model Explainability & SHAP Summary

Using SHAP (SHapley Additive exPlanations):
1. **Contract Type (Month-to-Month)**: Highest positive impact on churn risk.
2. **Tenure Duration**: Inverse relationship—lower tenure drastically increases churn probability.
3. **Fiber Optic Service**: High monthly cost without Tech Support acts as a strong secondary driver of churn.

---

### Phase 7: FastAPI Production Backend API

#### 1. Health Check (`GET /api/v1/health`)
Verifies service availability and model status.

#### 2. Predict Churn Risk (`POST /api/v1/predict-churn`)
#### 3. Predict Customer Lifetime Value (`POST /api/v1/predict-ltv`)

---

### Phase 8: Interactive HTML/CSS/JS Executive Web Dashboard

- Open [`dashboard/index.html`](file:///c:/Users/Sai/OneDrive/Desktop/Customer_churn/dashboard/index.html) in any browser to access the executive dashboard.
- Features executive KPI summary cards, interactive Chart.js charts, global filter bar (Contract, Payment Method, Internet Service, Risk Tier), live prediction calculator, and searchable CRM target list.

---

## Installation & Execution Guide

### 1. Clone Repository & Setup Virtual Environment
```bash
git clone https://github.com/SruthikarReddy11/Customer-Churn-Prediction.git
cd Customer_churn

python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Full Pipeline (Data Processing, Model Training & Plot Export)
```bash
python run_pipeline.py
```

### 4. Run Pytest Test Suite
```bash
python -m pytest tests/ -v
```

### 5. Launch FastAPI Backend Server
```bash
python -m uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Launch Web Dashboard
Open `dashboard/index.html` in your web browser or serve via Python:
```bash
python -m http.server 3000 --directory dashboard
```

---

## License
Distributed under the MIT License. See `LICENSE` for more information.