"""
Data Cleaning Module.
Handles missing values, empty strings, data type casting, and duplicate removal.
"""

from pathlib import Path
import pandas as pd
import numpy as np
from src.config import RAW_DATA_PATH, CLEANED_DATA_PATH
from src.data_loader import load_raw_data
from src.logger import logger

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans raw DataFrame:
    1. Trims string columns.
    2. Coerces 'TotalCharges' whitespace to numeric (NaN) and imputes missing values.
    3. Verifies zero duplicates.
    4. Casts target binary indicator.
    
    Parameters:
        df (pd.DataFrame): Raw DataFrame.
        
    Returns:
        pd.DataFrame: Cleaned DataFrame.
    """
    logger.info("Starting data cleaning pipeline...")
    df = df.copy()
    
    # 1. Trim whitespace in string object columns
    str_cols = df.select_dtypes(include=["object"]).columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()

    # 2. Convert TotalCharges from object/string to float
    # Empty string ' ' occurs when tenure = 0 (new customers)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    
    missing_total_charges = df["TotalCharges"].isnull().sum()
    logger.info(f"Found {missing_total_charges} missing values in TotalCharges.")
    
    # Fill missing TotalCharges with MonthlyCharges * tenure or 0 when tenure is 0
    df["TotalCharges"] = df["TotalCharges"].fillna(df["MonthlyCharges"] * df["tenure"])

    # 3. Check and remove duplicates
    initial_rows = len(df)
    df = df.drop_duplicates()
    dedup_rows = len(df)
    if initial_rows > dedup_rows:
        logger.info(f"Removed {initial_rows - dedup_rows} duplicate rows.")
    else:
        logger.info("No duplicate rows found.")

    # 4. Binary churn indicator
    if "Churn" in df.columns:
        df["ChurnBinary"] = (df["Churn"] == "Yes").astype(int)
        
    logger.info(f"Cleaning complete. Output shape: {df.shape}")
    return df

def save_cleaned_data(df: pd.DataFrame, output_path: Path = CLEANED_DATA_PATH) -> None:
    """Saves cleaned DataFrame to CSV."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    logger.info(f"Cleaned dataset saved to {output_path}")

if __name__ == "__main__":
    raw_df = load_raw_data()
    cleaned_df = clean_data(raw_df)
    save_cleaned_data(cleaned_df)
