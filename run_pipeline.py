"""
Pipeline Execution Runner Script.
Runs data loading, cleaning, feature engineering, model training, and explainability.
"""

import sys
from pathlib import Path
from src.data_loader import load_raw_data
from src.cleaner import clean_data, save_cleaned_data
from src.eda import generate_eda_reports
from src.feature_engineering import build_features, preprocess_and_split
from src.model_trainer import train_and_evaluate_all
from src.explainability import run_explainability_analysis
from src.config import FEATURED_DATA_PATH
from src.logger import logger

def run_pipeline():
    logger.info("================ STARTING FULL PIPELINE ================")
    
    # 1. Load & Clean
    raw_df = load_raw_data()
    cleaned_df = clean_data(raw_df)
    save_cleaned_data(cleaned_df)
    
    # 2. EDA Reports
    eda_summary = generate_eda_reports(cleaned_df)
    logger.info(f"EDA Completed. Overall Churn Rate: {eda_summary['churn_rate']:.2%}")
    
    # 3. Feature Engineering
    featured_df = build_features(cleaned_df)
    featured_df.to_csv(FEATURED_DATA_PATH, index=False)
    data_bundle = preprocess_and_split(featured_df)
    
    # 4. Model Training & Evaluation
    best_model_name, metrics = train_and_evaluate_all()
    logger.info(f"Pipeline Completed. Best Churn Model: {best_model_name}")
    
    # 5. Explainability & SHAP
    run_explainability_analysis()
    logger.info("================ PIPELINE SUCCESSFULLY COMPLETED ================")

if __name__ == "__main__":
    run_pipeline()
