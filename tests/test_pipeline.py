"""
Comprehensive Pytest Unit & Integration Test Suite.
Verifies data cleaning, feature engineering, model artifacts, and FastAPI endpoints.
"""

import os
import pickle
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from src.config import (
    RAW_DATA_PATH, CLEANED_DATA_PATH, BEST_CHURN_MODEL_PATH,
    LTV_MODEL_PATH, ENCODER_PATH
)
from src.cleaner import clean_data
from src.feature_engineering import build_features
from src.api.app import app

client = TestClient(app)

# 1. Test Data Cleaning
def test_clean_data():
    raw_df = pd.read_csv(RAW_DATA_PATH)
    cleaned_df = clean_data(raw_df)
    
    assert cleaned_df.isnull().sum().sum() == 0, "Cleaned dataset must contain 0 null values."
    assert cleaned_df["TotalCharges"].dtype in [np.float64, np.float32, float], "TotalCharges must be float."
    assert "ChurnBinary" in cleaned_df.columns, "ChurnBinary target column must exist."


# 2. Test Feature Engineering
def test_build_features():
    sample_data = pd.DataFrame([{
        "customerID": "TEST-01",
        "gender": "Female",
        "SeniorCitizen": 0,
        "Partner": "No",
        "Dependents": "No",
        "tenure": 5,
        "PhoneService": "Yes",
        "MultipleLines": "No",
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "OnlineBackup": "No",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "Yes",
        "StreamingMovies": "No",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 80.0,
        "TotalCharges": 400.0,
        "Churn": "Yes",
        "ChurnBinary": 1
    }])
    
    featured = build_features(sample_data)
    assert "TenureGroup" in featured.columns, "TenureGroup must be created."
    assert "TotalServices" in featured.columns, "TotalServices count must be created."
    assert "ContractRiskScore" in featured.columns, "ContractRiskScore must be created."
    assert featured["Historical_LTV"].iloc[0] == 400.0, "Historical LTV must equal 80.0 * 5."


# 3. Test Model Files Artifacts
def test_model_artifacts_exist():
    assert BEST_CHURN_MODEL_PATH.exists(), f"Churn model missing at {BEST_CHURN_MODEL_PATH}"
    assert LTV_MODEL_PATH.exists(), f"LTV model missing at {LTV_MODEL_PATH}"
    assert ENCODER_PATH.exists(), f"Encoder missing at {ENCODER_PATH}"


# 4. Test FastAPI API Endpoints
def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert json_data["models_loaded"]["churn_model"] is True


def test_api_predict_churn():
    payload = {
        "customer_id": "TEST-CHURN",
        "gender": "Female",
        "SeniorCitizen": 0,
        "Partner": "No",
        "Dependents": "No",
        "tenure": 2,
        "PhoneService": "Yes",
        "MultipleLines": "No",
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "OnlineBackup": "No",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "No",
        "StreamingMovies": "No",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 85.0,
        "TotalCharges": 170.0
    }
    response = client.post("/api/v1/predict-churn", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["customer_id"] == "TEST-CHURN"
    assert "churn_probability" in res
    assert res["risk_tier"] in ["Low Risk", "Medium Risk", "High Risk"]
    assert len(res["top_risk_drivers"]) > 0


def test_api_predict_ltv():
    payload = {
        "customer_id": "TEST-LTV",
        "gender": "Male",
        "SeniorCitizen": 0,
        "Partner": "Yes",
        "Dependents": "Yes",
        "tenure": 24,
        "PhoneService": "Yes",
        "MultipleLines": "Yes",
        "InternetService": "DSL",
        "OnlineSecurity": "Yes",
        "OnlineBackup": "Yes",
        "DeviceProtection": "Yes",
        "TechSupport": "Yes",
        "StreamingTV": "No",
        "StreamingMovies": "No",
        "Contract": "Two year",
        "PaperlessBilling": "No",
        "PaymentMethod": "Credit card (automatic)",
        "MonthlyCharges": 65.0,
        "TotalCharges": 1560.0
    }
    response = client.post("/api/v1/predict-ltv", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["customer_id"] == "TEST-LTV"
    assert res["predicted_lifetime_value"] >= 1560.0
