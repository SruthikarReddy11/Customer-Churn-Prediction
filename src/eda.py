"""
Exploratory Data Analysis (EDA) Module.
Generates statistical summaries, univariate & bivariate analysis, correlation matrices, 
and exports high-resolution visual plots to reports/figures/.
"""

from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from src.config import CLEANED_DATA_PATH, FIGURES_DIR
from src.logger import logger

# Set publication style
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams["font.sans-serif"] = "DejaVu Sans"
plt.rcParams["axes.edgecolor"] = "#cccccc"
plt.rcParams["axes.linewidth"] = 0.8

def generate_eda_reports(df: pd.DataFrame, output_dir: Path = FIGURES_DIR) -> dict:
    """
    Performs comprehensive EDA and exports publication-ready visual figures.
    
    Parameters:
        df (pd.DataFrame): Cleaned customer DataFrame.
        output_dir (Path): Output directory for plots.
        
    Returns:
        dict: EDA summary dictionary.
    """
    logger.info("Generating EDA visual reports...")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Statistical Summary
    num_summary = df[["tenure", "MonthlyCharges", "TotalCharges"]].describe()
    logger.info("Numerical Summary Computed.")

    # 2. Plot Target Distribution (Churn Rate)
    fig, ax = plt.subplots(figsize=(6, 5))
    churn_counts = df["Churn"].value_counts()
    colors = ["#2b5c8f", "#d9534f"]
    bars = ax.bar(churn_counts.index, churn_counts.values, color=colors, width=0.5)
    ax.set_title("Overall Customer Churn Distribution", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Churn Status", fontsize=12)
    ax.set_ylabel("Customer Count", fontsize=12)
    
    for bar in bars:
        height = bar.get_height()
        pct = (height / len(df)) * 100
        ax.annotate(f"{height:,}\n({pct:.1f}%)",
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3), textcoords="offset points",
                    ha="center", va="bottom", fontsize=10, fontweight="bold")
                    
    plt.tight_layout()
    plt.savefig(output_dir / "01_churn_distribution.png", dpi=300)
    plt.close()

    # 3. Bivariate Analysis: Churn by Contract Type
    fig, ax = plt.subplots(figsize=(8, 5))
    contract_churn = pd.crosstab(df["Contract"], df["Churn"], normalize="index") * 100
    contract_churn.plot(kind="bar", stacked=False, color=colors, ax=ax, width=0.6)
    ax.set_title("Churn Rate (%) by Contract Duration", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Contract Type", fontsize=12)
    ax.set_ylabel("Percentage (%)", fontsize=12)
    plt.xticks(rotation=0)
    
    for p in ax.patches:
        height = p.get_height()
        if height > 0:
            ax.annotate(f"{height:.1f}%",
                        (p.get_x() + p.get_width() / 2., height),
                        ha='center', va='bottom', fontsize=9, xytext=(0, 2),
                        textcoords='offset points')
                        
    plt.tight_layout()
    plt.savefig(output_dir / "02_churn_by_contract.png", dpi=300)
    plt.close()

    # 4. Numerical Distribution: Tenure & Monthly Charges KDE by Churn
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    sns.kdeplot(data=df, x="tenure", hue="Churn", palette=colors, fill=True, common_norm=False, ax=axes[0])
    axes[0].set_title("Tenure Distribution by Churn", fontsize=13, fontweight="bold")
    axes[0].set_xlabel("Tenure (Months)", fontsize=11)
    
    sns.kdeplot(data=df, x="MonthlyCharges", hue="Churn", palette=colors, fill=True, common_norm=False, ax=axes[1])
    axes[1].set_title("Monthly Charges Distribution by Churn", fontsize=13, fontweight="bold")
    axes[1].set_xlabel("Monthly Charges ($)", fontsize=11)
    
    plt.tight_layout()
    plt.savefig(output_dir / "03_tenure_monthlycharges_kde.png", dpi=300)
    plt.close()

    # 5. Correlation Analysis for Encoded Features
    df_encoded = df.copy()
    for col in df_encoded.select_dtypes(include=["object"]).columns:
        if col != "customerID":
            df_encoded[col] = df_encoded[col].astype("category").cat.codes
            
    corr_matrix = df_encoded.drop(columns=["customerID"]).corr()
    
    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(corr_matrix[["ChurnBinary"]].sort_values(by="ChurnBinary", ascending=False),
                annot=True, fmt=".2f", cmap="coolwarm", cbar=True, ax=ax)
    ax.set_title("Feature Correlation with Churn Status", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output_dir / "04_correlation_heatmap.png", dpi=300)
    plt.close()

    logger.info(f"All EDA figures successfully saved to {output_dir}")
    return {
        "churn_rate": (df["Churn"] == "Yes").mean(),
        "summary": num_summary.to_dict()
    }

if __name__ == "__main__":
    if CLEANED_DATA_PATH.exists():
        df_clean = pd.read_csv(CLEANED_DATA_PATH)
        generate_eda_reports(df_clean)
