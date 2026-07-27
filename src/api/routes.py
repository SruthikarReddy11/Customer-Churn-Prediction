"""
FastAPI Route Handlers.
Implements endpoints for Health Check, Churn Prediction, LTV Prediction, and Model Metrics.
"""

import json
import pickle
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Depends

from src.api.schemas import (
    CustomerInput, ChurnPredictionResponse,
    LTVPredictionResponse, HealthCheckResponse
)
from src.config import (
    BEST_CHURN_MODEL_PATH, LTV_MODEL_PATH, ENCODER_PATH,
    MODEL_METRICS_PATH
)
from src.feature_engineering import build_features
from src.utils import categorize_risk, calculate_predicted_ltv
from src.logger import logger

router = APIRouter()

# Global state holders for loaded model artifacts
_churn_model = None
_ltv_model = None
_preprocessor = None

def get_models():
    """Lazy loader and dependency injector for ML models."""
    global _churn_model, _ltv_model, _preprocessor
    if _churn_model is None or _preprocessor is None:
        try:
            if BEST_CHURN_MODEL_PATH.exists():
                with open(BEST_CHURN_MODEL_PATH, "rb") as f:
                    _churn_model = pickle.load(f)
            if LTV_MODEL_PATH.exists():
                with open(LTV_MODEL_PATH, "rb") as f:
                    _ltv_model = pickle.load(f)
            if ENCODER_PATH.exists():
                with open(ENCODER_PATH, "rb") as f:
                    _preprocessor = pickle.load(f)
        except Exception as e:
            logger.error(f"Failed to load model artifacts: {str(e)}")
    return _churn_model, _ltv_model, _preprocessor


@router.get("/health", response_model=HealthCheckResponse, tags=["Health"])
def health_check():
    """Health check endpoint confirming API availability and model status."""
    churn_m, ltv_m, prep = get_models()
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        models_loaded={
            "churn_model": churn_m is not None,
            "ltv_model": ltv_m is not None,
            "preprocessor": prep is not None
        }
    )


@router.post("/predict-churn", response_model=ChurnPredictionResponse, tags=["Predictions"])
def predict_churn(input_data: CustomerInput):
    """
    Predicts customer churn probability, categorizes risk tier, and extracts risk drivers.
    """
    churn_model, _, preprocessor = get_models()
    if churn_model is None or preprocessor is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Run training pipeline first.")

    try:
        # Convert input payload to DataFrame
        raw_dict = input_data.model_dump()
        customer_id = raw_dict.pop("customer_id", "UNKNOWN")
        
        # Format TotalCharges if missing
        if raw_dict.get("TotalCharges") is None:
            raw_dict["TotalCharges"] = raw_dict["MonthlyCharges"] * raw_dict["tenure"]

        df_input = pd.DataFrame([raw_dict])
        df_input["customerID"] = customer_id
        df_input["Churn"] = "No"
        df_input["ChurnBinary"] = 0

        # Feature Engineering Pipeline
        df_featured = build_features(df_input)
        X_eval = df_featured.drop(columns=["customerID", "Churn", "ChurnBinary", "Historical_LTV"])

        # Preprocess / Scale using fitted ColumnTransformer
        X_trans = preprocessor.transform(X_eval)

        # Inference
        prob = float(churn_model.predict_proba(X_trans)[0][1])
        pred = int(prob >= 0.5)
        risk_tier = categorize_risk(prob)

        # Rule-based Top Risk Drivers
        drivers = []
        if raw_dict["Contract"] == "Month-to-month":
            drivers.append("Month-to-Month Contract Status (High Vulnerability)")
        if raw_dict["tenure"] <= 12:
            drivers.append("Early Lifecycle Tenure (<= 12 Months)")
        if raw_dict["InternetService"] == "Fiber optic" and raw_dict["TechSupport"] == "No":
            drivers.append("Fiber Optic without Technical Support Add-on")
        if raw_dict["PaymentMethod"] == "Electronic check":
            drivers.append("Electronic Check Manual Payment Method")

        if not drivers:
            drivers.append("Standard Baseline Activity Profile")

        # Actionable Recommendation
        rec = "No immediate action required."
        if risk_tier == "High Risk":
            rec = "Offer 15% discount for switching to 1-Year Contract + Free Tech Support."
        elif risk_tier == "Medium Risk":
            rec = "Send targeted email campaign promoting Auto-Pay and streaming add-ons."

        return ChurnPredictionResponse(
            customer_id=customer_id,
            churn_prediction=pred,
            churn_status="Yes" if pred == 1 else "No",
            churn_probability=round(prob, 4),
            risk_tier=risk_tier,
            top_risk_drivers=drivers,
            retention_recommendation=rec
        )

    except Exception as e:
        logger.error(f"Error in predict_churn: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.post("/predict-ltv", response_model=LTVPredictionResponse, tags=["Predictions"])
def predict_ltv(input_data: CustomerInput):
    """
    Predicts Customer Lifetime Value (LTV) and remaining expected lifespan.
    """
    churn_model, ltv_model, preprocessor = get_models()
    if preprocessor is None:
        raise HTTPException(status_code=503, detail="Preprocessor models not loaded.")

    try:
        raw_dict = input_data.model_dump()
        customer_id = raw_dict.pop("customer_id", "UNKNOWN")
        
        if raw_dict.get("TotalCharges") is None:
            raw_dict["TotalCharges"] = raw_dict["MonthlyCharges"] * raw_dict["tenure"]

        df_input = pd.DataFrame([raw_dict])
        df_input["customerID"] = customer_id
        df_input["Churn"] = "No"
        df_input["ChurnBinary"] = 0

        df_featured = build_features(df_input)
        baseline_ltv = float(df_featured["Historical_LTV"].iloc[0])

        # Get Churn Prob
        X_eval = df_featured.drop(columns=["customerID", "Churn", "ChurnBinary", "Historical_LTV"])
        X_trans = preprocessor.transform(X_eval)

        prob = 0.3
        if churn_model is not None:
            prob = float(churn_model.predict_proba(X_trans)[0][1])

        # Regression prediction or formulaic calculation
        if ltv_model is not None:
            predicted_ltv = float(ltv_model.predict(X_trans)[0])
        else:
            predicted_ltv = calculate_predicted_ltv(raw_dict["MonthlyCharges"], raw_dict["tenure"], prob)

        remaining_months = max(1.0, round((predicted_ltv - baseline_ltv) / (raw_dict["MonthlyCharges"] + 1e-5), 1))
        val_tier = "High Value Customer" if predicted_ltv >= 2500.0 else "Standard Value Customer"

        return LTVPredictionResponse(
            customer_id=customer_id,
            current_tenure_months=raw_dict["tenure"],
            monthly_charges=raw_dict["MonthlyCharges"],
            baseline_historical_ltv=round(baseline_ltv, 2),
            predicted_lifetime_value=round(max(baseline_ltv, predicted_ltv), 2),
            expected_remaining_months=remaining_months,
            valuation_tier=val_tier
        )

    except Exception as e:
        logger.error(f"Error in predict_ltv: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LTV Inference error: {str(e)}")


@router.get("/model-metrics", tags=["Analytics"])
def get_model_metrics():
    """Returns stored cross-model evaluation performance metrics."""
    if MODEL_METRICS_PATH.exists():
        with open(MODEL_METRICS_PATH, "r") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Metrics file not found.")
