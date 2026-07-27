import pandas as pd
import json

df = pd.read_csv("data_processed/cleaned_churn_data.csv")

# Compute risk score estimation for dataset rows
def estimate_risk(row):
    prob = 0.15
    if row["Contract"] == "Month-to-month": prob += 0.35
    if row["tenure"] <= 12: prob += 0.20
    if row["InternetService"] == "Fiber optic" and row["TechSupport"] == "No": prob += 0.15
    if row["PaymentMethod"] == "Electronic check": prob += 0.10
    return min(0.95, round(prob, 2))

df["risk"] = df.apply(estimate_risk, axis=1)
df["ltv"] = (df["MonthlyCharges"] * df["tenure"]).round(2)

# Sample 300 rows to keep JS bundle light and ultra fast
df_sample = df.sample(n=300, random_state=42).copy()

records = []
for _, row in df_sample.iterrows():
    records.append({
        "id": str(row["customerID"]),
        "gender": str(row["gender"]),
        "senior": int(row["SeniorCitizen"]),
        "tenure": int(row["tenure"]),
        "contract": str(row["Contract"]),
        "internet": str(row["InternetService"]),
        "techSupport": str(row["TechSupport"]),
        "payment": str(row["PaymentMethod"]),
        "monthly": float(row["MonthlyCharges"]),
        "ltv": float(row["ltv"]),
        "churn": str(row["Churn"]),
        "risk": float(row["risk"])
    })

js_content = f"// Comprehensive Dashboard Customer Dataset (300 Records)\nconst fullCustomerDataset = {json.dumps(records, indent=2)};\n"

with open("dashboard/dataset.js", "w") as f:
    f.write(js_content)

print(f"Exported {len(records)} customer records to dashboard/dataset.js")
