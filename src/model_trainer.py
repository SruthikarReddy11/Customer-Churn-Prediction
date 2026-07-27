"""
Model Training & Evaluation Module.
Trains Logistic Regression, Decision Tree, Random Forest, and XGBoost models.
Evaluates accuracy, precision, recall, f1, roc-auc, and confusion matrices.
Serializes best classification and LTV regression models to models/.
"""

import json
import pickle
from pathlib import Path
import pandas as pd
import numpy as np

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error, r2_score
)

from src.config import (
    TRAIN_TEST_DATA_PATH, BEST_CHURN_MODEL_PATH, LTV_MODEL_PATH,
    MODEL_METRICS_PATH, RANDOM_STATE
)
from src.logger import logger

def train_and_evaluate_all():
    """
    Trains classification models and LTV regression model.
    Evaluates metrics, identifies best model, and serializes artifacts.
    """
    logger.info("Loading preprocessed dataset bundle...")
    with open(TRAIN_TEST_DATA_PATH, "rb") as f:
        bundle = pickle.load(f)

    X_train, X_test = bundle["X_train"], bundle["X_test"]
    y_train, y_test = bundle["y_train"], bundle["y_test"]
    ltv_train, ltv_test = bundle["ltv_train"], bundle["ltv_test"]

    # 1. Define Classification Models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        "Decision Tree": DecisionTreeClassifier(max_depth=6, random_state=RANDOM_STATE),
        "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=8, random_state=RANDOM_STATE),
        "XGBoost": XGBClassifier(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=5,
            eval_metric="logloss",
            random_state=RANDOM_STATE
        )
    }

    metrics_summary = {}
    fitted_models = {}

    logger.info("Training Churn Classification Models...")
    best_model_name = None
    best_roc_auc = 0.0

    for name, model in models.items():
        logger.info(f"Training {name}...")
        model.fit(X_train, y_train)
        fitted_models[name] = model

        y_pred = model.predict(X_test)
        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)[:, 1]
        else:
            y_prob = y_pred

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        metrics_summary[name] = {
            "Accuracy": float(round(acc, 4)),
            "Precision": float(round(prec, 4)),
            "Recall": float(round(rec, 4)),
            "F1 Score": float(round(f1, 4)),
            "ROC-AUC": float(round(roc_auc, 4)),
            "Confusion Matrix": cm
        }

        logger.info(f"{name} -> Accuracy: {acc:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}, ROC-AUC: {roc_auc:.4f}")

        if roc_auc > best_roc_auc:
            best_roc_auc = roc_auc
            best_model_name = name

    logger.info(f"Selected Best Churn Model: {best_model_name} with ROC-AUC: {best_roc_auc:.4f}")
    best_churn_model = fitted_models[best_model_name]

    # Save Best Churn Model
    with open(BEST_CHURN_MODEL_PATH, "wb") as f:
        pickle.dump(best_churn_model, f)
    logger.info(f"Best Churn Model ({best_model_name}) saved to {BEST_CHURN_MODEL_PATH}")

    # 2. Train LTV Regressor
    logger.info("Training Customer Lifetime Value (LTV) Regressor...")
    ltv_model = XGBRegressor(n_estimators=120, learning_rate=0.05, max_depth=5, random_state=RANDOM_STATE)
    ltv_model.fit(X_train, ltv_train)
    ltv_pred = ltv_model.predict(X_test)

    rmse = np.sqrt(mean_squared_error(ltv_test, ltv_pred))
    r2 = r2_score(ltv_test, ltv_pred)

    metrics_summary["LTV Regressor (XGBoost)"] = {
        "RMSE": float(round(rmse, 2)),
        "R2 Score": float(round(r2, 4))
    }
    logger.info(f"LTV Regressor -> RMSE: ${rmse:.2f}, R2 Score: {r2:.4f}")

    with open(LTV_MODEL_PATH, "wb") as f:
        pickle.dump(ltv_model, f)
    logger.info(f"LTV Model saved to {LTV_MODEL_PATH}")

    # Save Metrics JSON
    with open(MODEL_METRICS_PATH, "w") as f:
        json.dump(metrics_summary, f, indent=4)
    logger.info(f"Performance metrics summary exported to {MODEL_METRICS_PATH}")

    return best_model_name, metrics_summary

if __name__ == "__main__":
    train_and_evaluate_all()
