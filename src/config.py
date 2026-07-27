"""
Centralized Configuration Module for Customer Churn & LTV Engine.
Defines file paths, model hyperparameters, feature groups, and database settings.
"""

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_RAW_DIR = BASE_DIR / "data_raw"
DATA_PROCESSED_DIR = BASE_DIR / "data_processed"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"

# File Paths
RAW_DATA_PATH = DATA_RAW_DIR / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
CLEANED_DATA_PATH = DATA_PROCESSED_DIR / "cleaned_churn_data.csv"
FEATURED_DATA_PATH = DATA_PROCESSED_DIR / "features_churn_data.csv"
TRAIN_TEST_DATA_PATH = DATA_PROCESSED_DIR / "train_test_data.pkl"

# Saved Model Paths
BEST_CHURN_MODEL_PATH = MODELS_DIR / "best_churn_model.pkl"
LTV_MODEL_PATH = MODELS_DIR / "ltv_model.pkl"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
ENCODER_PATH = MODELS_DIR / "encoder.pkl"
MODEL_METRICS_PATH = MODELS_DIR / "metrics.json"

# Categorical & Numerical Feature Definitions
ID_COLUMN = "customerID"
TARGET_COLUMN = "Churn"

NUMERICAL_COLS = ["tenure", "MonthlyCharges", "TotalCharges"]

CATEGORICAL_COLS = [
    "gender", "SeniorCitizen", "Partner", "Dependents", "PhoneService",
    "MultipleLines", "InternetService", "OnlineSecurity", "OnlineBackup",
    "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies",
    "Contract", "PaperlessBilling", "PaymentMethod"
]

# Random State & Splitting
RANDOM_STATE = 42
TEST_SIZE = 0.2

# Ensure directories exist
DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
FIGURES_DIR.mkdir(parents=True, exist_ok=True)
