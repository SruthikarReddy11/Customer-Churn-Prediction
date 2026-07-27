"""
Utility Helpers Module.
Provides helper routines for metric formatting, risk tier assignment, and object serialization.
"""

def categorize_risk(probability: float) -> str:
    """Categorizes churn probability into actionable risk tiers."""
    if probability >= 0.70:
        return "High Risk"
    elif probability >= 0.40:
        return "Medium Risk"
    else:
        return "Low Risk"

def calculate_predicted_ltv(monthly_charges: float, tenure: int, churn_prob: float) -> float:
    """
    Calculates estimated Customer Lifetime Value:
    Predicted LTV = MonthlyCharges * (tenure + estimated_remaining_months)
    where estimated_remaining_months = 1 / (churn_prob + 0.05) capped at 36 months.
    """
    remaining_months = min(36.0, 1.0 / (churn_prob + 0.05))
    total_months = tenure + remaining_months
    return round(monthly_charges * total_months, 2)
