"""
Feature Engineering & Data Preprocessing Module.
Applies domain-specific transformations, LTV computations, categorical encoding,
feature scaling, and stratified train-test splitting.
"""

from pathlib import Path
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

from src.config import (
    CLEANED_DATA_PATH, FEATURED_DATA_PATH, TRAIN_TEST_DATA_PATH,
    SCALER_PATH, ENCODER_PATH, RANDOM_STATE, TEST_SIZE
)
from src.logger import logger

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Creates strategic feature domain transformations and computes Historical LTV.
    
    Parameters:
        df (pd.DataFrame): Cleaned customer DataFrame.
        
    Returns:
        pd.DataFrame: DataFrame augmented with engineered features.
    """
    logger.info("Building domain features and LTV metrics...")
    df = df.copy()

    # 1. Tenure Cohort Binning
    df["TenureGroup"] = pd.cut(
        df["tenure"],
        bins=[-1, 12, 24, 48, 72],
        labels=["0-1 Year", "1-2 Years", "2-4 Years", "4+ Years"]
    ).astype(str)

    # 2. Total Services Count
    service_cols = [
        "PhoneService", "MultipleLines", "OnlineSecurity", "OnlineBackup",
        "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies"
    ]
    
    def count_active_services(row):
        count = 0
        for col in service_cols:
            val = str(row[col])
            if val == "Yes":
                count += 1
        if row["InternetService"] in ["DSL", "Fiber optic"]:
            count += 1
        return count

    df["TotalServices"] = df.apply(count_active_services, axis=1)
    df["TotalServicesCount"] = df["TotalServices"]

    # 3. Contract Risk Score (Month-to-month=3, One year=2, Two year=1)
    contract_risk_map = {"Month-to-month": 3, "One year": 2, "Two year": 1}
    df["ContractRiskScore"] = df["Contract"].map(contract_risk_map).fillna(2)

    # 4. Charges Ratio & Historical LTV
    df["ChargesPerMonthRatio"] = df["TotalCharges"] / (df["tenure"] + 1)
    df["Historical_LTV"] = df["MonthlyCharges"] * df["tenure"]

    logger.info(f"Feature engineering complete. Total columns: {len(df.columns)}")
    return df


def preprocess_and_split(df: pd.DataFrame):
    """
    Encodes categorical features, scales numerical variables, and performs 
    stratified train-test split for classification and regression targets.
    
    Parameters:
        df (pd.DataFrame): Engineered DataFrame.
        
    Returns:
        dict: Preprocessed split dataset dictionary.
    """
    logger.info("Starting encoding, scaling, and train-test splitting...")
    
    # Define Target and Drop ID
    X_df = df.drop(columns=["customerID", "Churn", "ChurnBinary", "Historical_LTV"])
    y_churn = df["ChurnBinary"]
    y_ltv = df["Historical_LTV"]  # Target for LTV regression model

    cat_cols = X_df.select_dtypes(include=["object", "category"]).columns.tolist()
    num_cols = X_df.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns.tolist()

    # Preprocessing Pipeline with ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False), cat_cols)
        ]
    )

    # Train-Test Split (80/20 Stratified on Churn)
    X_train, X_test, y_train, y_test, ltv_train, ltv_test = train_test_split(
        X_df, y_churn, y_ltv, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y_churn
    )

    # Fit preprocessor on training data
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    # Retrieve feature names after one-hot encoding
    cat_feature_names = preprocessor.named_transformers_["cat"].get_feature_names_out(cat_cols)
    feature_names = num_cols + list(cat_feature_names)

    X_train_processed = pd.DataFrame(X_train_trans, columns=feature_names, index=X_train.index)
    X_test_processed = pd.DataFrame(X_test_trans, columns=feature_names, index=X_test.index)

    # Save Preprocessor / Scaler artifacts
    SCALER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(preprocessor, f)
    logger.info(f"ColumnTransformer (Scaler + Encoder) saved to {ENCODER_PATH}")

    data_bundle = {
        "X_train": X_train_processed,
        "X_test": X_test_processed,
        "y_train": y_train,
        "y_test": y_test,
        "ltv_train": ltv_train,
        "ltv_test": ltv_test,
        "feature_names": feature_names,
        "num_cols": num_cols,
        "cat_cols": cat_cols
    }

    with open(TRAIN_TEST_DATA_PATH, "wb") as f:
        pickle.dump(data_bundle, f)
    logger.info(f"Train/Test dataset bundle successfully saved to {TRAIN_TEST_DATA_PATH}")

    return data_bundle

if __name__ == "__main__":
    if CLEANED_DATA_PATH.exists():
        df_clean = pd.read_csv(CLEANED_DATA_PATH)
        df_featured = build_features(df_clean)
        df_featured.to_csv(FEATURED_DATA_PATH, index=False)
        preprocess_and_split(df_featured)
