"""
Pydantic Request & Response Schemas for FastAPI Endpoints.
Defines input data validation rules and structured response models.
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class CustomerInput(BaseModel):
    customer_id: Optional[str] = Field(default="7590-VHVEG", description="Unique Customer Identifier")
    gender: str = Field(default="Female", description="Gender: Female, Male")
    SeniorCitizen: int = Field(default=0, ge=0, le=1, description="Senior Citizen status: 0 or 1")
    Partner: str = Field(default="Yes", description="Has partner: Yes, No")
    Dependents: str = Field(default="No", description="Has dependents: Yes, No")
    tenure: int = Field(default=1, ge=0, description="Tenure in months")
    PhoneService: str = Field(default="No", description="Phone service: Yes, No")
    MultipleLines: str = Field(default="No phone service", description="Multiple lines status")
    InternetService: str = Field(default="DSL", description="Internet Service: DSL, Fiber optic, No")
    OnlineSecurity: str = Field(default="No", description="Online security add-on")
    OnlineBackup: str = Field(default="Yes", description="Online backup add-on")
    DeviceProtection: str = Field(default="No", description="Device protection add-on")
    TechSupport: str = Field(default="No", description="Tech support add-on")
    StreamingTV: str = Field(default="No", description="Streaming TV add-on")
    StreamingMovies: str = Field(default="No", description="Streaming Movies add-on")
    Contract: str = Field(default="Month-to-month", description="Contract duration: Month-to-month, One year, Two year")
    PaperlessBilling: str = Field(default="Yes", description="Paperless billing: Yes, No")
    PaymentMethod: str = Field(default="Electronic check", description="Payment method")
    MonthlyCharges: float = Field(default=29.85, ge=0.0, description="Monthly bill amount ($)")
    TotalCharges: Optional[float] = Field(default=29.85, ge=0.0, description="Total accumulated bill amount ($)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "customer_id": "9237-HQITU",
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
                "MonthlyCharges": 70.70,
                "TotalCharges": 151.65
            }
        }
    }

class ChurnPredictionResponse(BaseModel):
    customer_id: str
    churn_prediction: int
    churn_status: str
    churn_probability: float
    risk_tier: str
    top_risk_drivers: List[str]
    retention_recommendation: str

class LTVPredictionResponse(BaseModel):
    customer_id: str
    current_tenure_months: int
    monthly_charges: float
    baseline_historical_ltv: float
    predicted_lifetime_value: float
    expected_remaining_months: float
    valuation_tier: str

class HealthCheckResponse(BaseModel):
    status: str
    version: str
    models_loaded: Dict[str, bool]

class AnalyticsSummaryResponse(BaseModel):
    total_customers: int
    churned_customers: int
    churn_rate_pct: float
    total_mrr: float
    at_risk_mrr: float
    avg_tenure_months: float
    avg_customer_ltv: float
