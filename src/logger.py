"""
Logging Module for Customer Churn Engine.
Provides consistent logging to console and log file with standard formatting.
"""

import logging
import sys
from pathlib import Path
from src.config import BASE_DIR

LOG_DIR = BASE_DIR / "reports" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"

def get_logger(name: str = "churn_engine") -> logging.Logger:
    """Configures and returns a logger instance."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        # Console Handler
        c_handler = logging.StreamHandler(sys.stdout)
        c_handler.setLevel(logging.INFO)
        c_format = logging.Formatter("[%(asctime)s] - %(levelname)s - %(name)s - %(message)s")
        c_handler.setFormatter(c_format)
        logger.addHandler(c_handler)

        # File Handler
        f_handler = logging.FileHandler(LOG_FILE)
        f_handler.setLevel(logging.INFO)
        f_format = logging.Formatter("[%(asctime)s] - %(levelname)s - %(name)s - %(message)s")
        f_handler.setFormatter(f_format)
        logger.addHandler(f_handler)

    return logger

logger = get_logger()
