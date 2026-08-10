"""
Model Explainability Module.
Generates Feature Importance and SHAP (SHapley Additive exPlanations) analysis,
exporting visual summary plots to reports/figures/.
"""

import pickle
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import shap

from src.config import TRAIN_TEST_DATA_PATH, BEST_CHURN_MODEL_PATH, FIGURES_DIR
from src.logger import logger

def run_explainability_analysis(output_dir: Path = FIGURES_DIR):
    """
    Executes Feature Importance and SHAP analysis on the best churn model.
    Saves visual plots to output_dir.
    """
    logger.info("Starting model explainability analysis...")
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(TRAIN_TEST_DATA_PATH, "rb") as f:
        bundle = pickle.load(f)

    X_test = bundle["X_test"]
    feature_names = bundle["feature_names"]

    with open(BEST_CHURN_MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    # 1. Standard Feature Importance Plot
    fig, ax = plt.subplots(figsize=(10, 6))
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_[0])
    else:
        importances = np.ones(len(feature_names)) / len(feature_names)

    feat_imp = pd.Series(importances, index=feature_names).sort_values(ascending=True).tail(15)
    feat_imp.plot(kind="barh", color="#2b5c8f", ax=ax)
    ax.set_title("Top 15 Most Important Features in Churn Prediction", fontsize=14, fontweight="bold")
    ax.set_xlabel("Relative Importance Score", fontsize=12)
    plt.tight_layout()
    plt.savefig(output_dir / "05_feature_importance.png", dpi=300)
    plt.close()

    # 2. SHAP Analysis
    logger.info("Computing SHAP values...")
    try:
        explainer = shap.Explainer(model, X_test)
        shap_values = explainer(X_test)

        # SHAP Summary Plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_test, show=False)
        plt.title("SHAP Summary Plot - Feature Contribution to Churn Risk", fontsize=14, fontweight="bold", pad=15)
        plt.tight_layout()
        plt.savefig(output_dir / "06_shap_summary.png", dpi=300, bbox_inches="tight")
        plt.close()

        # SHAP Bar Plot
        plt.figure(figsize=(10, 6))
        shap.plots.bar(shap_values, show=False)
        plt.title("Mean Absolute SHAP Impact on Churn Model Output", fontsize=14, fontweight="bold", pad=15)
        plt.tight_layout()
        plt.savefig(output_dir / "07_shap_bar_importance.png", dpi=300, bbox_inches="tight")
        plt.close()

        logger.info("SHAP plots successfully saved to reports/figures/.")
    except Exception as e:
        logger.warning(f"SHAP explanation fallback triggered due to: {str(e)}")

if __name__ == "__main__":
    run_explainability_analysis()
