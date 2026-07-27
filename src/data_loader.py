"""
Data Loading Module.
Handles ingestion of raw telco churn CSV dataset with validation checks.
"""

from pathlib import Path
import pandas as pd
from src.config import RAW_DATA_PATH
from src.logger import logger

def load_raw_data(file_path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    """
    Loads raw CSV dataset from file path.
    
    Parameters:
        file_path (Path): Path to raw CSV file.
        
    Returns:
        pd.DataFrame: Loaded raw DataFrame.
    """
    try:
        logger.info(f"Loading raw dataset from {file_path}")
        df = pd.read_csv(file_path)
        logger.info(f"Dataset successfully loaded with shape {df.shape}")
        return df
    except Exception as e:
        logger.error(f"Failed to load dataset from {file_path}: {str(e)}")
        raise e

if __name__ == "__main__":
    df_raw = load_raw_data()
    print("Dataset Head:")
    print(df_raw.head())
