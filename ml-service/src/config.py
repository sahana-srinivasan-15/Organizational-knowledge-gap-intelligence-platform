import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"

DATA_PATH = DATA_DIR / "synthetic_training_outcomes_dev.csv"
MODEL_PATH = MODEL_DIR / "training_outcome_pipeline.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"

FEATURE_COLUMNS = [
    "baseline_proficiency_avg",
    "initial_gap_magnitude",
    "historical_completion_rate",
    "diagnostic_assessment_score",
    "weekly_engagement_hours",
    "course_difficulty_level",
    "mentor_assigned_flag",
    "tenure_months",
]

TARGET_COLUMN = "completion_outcome"

PORT = int(os.getenv("ML_SERVICE_PORT", 8000))
HOST = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
MODEL_VERSION = "v1.0.0-dev"
