import pytest
from pathlib import Path
import pandas as pd
from src.data_generator import generate_synthetic_dataset
from src.train import train_and_evaluate
from src.config import MODEL_PATH, METRICS_PATH, FEATURE_COLUMNS, TARGET_COLUMN

def test_data_generator(tmp_path):
    test_csv = tmp_path / "test_data.csv"
    df = generate_synthetic_dataset(n_samples=100, random_state=42, output_path=test_csv)
    
    assert test_csv.exists()
    assert len(df) == 100
    for col in FEATURE_COLUMNS:
        assert col in df.columns
    assert TARGET_COLUMN in df.columns
    assert set(df[TARGET_COLUMN].unique()).issubset({0, 1})

def test_training_pipeline_execution():
    metrics = train_and_evaluate(random_state=42)
    
    assert MODEL_PATH.exists(), "Model artifact should be persisted"
    assert METRICS_PATH.exists(), "Metrics artifact should be persisted"
    
    assert "data_provenance" in metrics
    assert metrics["data_provenance"]["type"] == "SYNTHETIC_DEVELOPMENT_DATASET"
    
    assert "cross_validation_5fold" in metrics
    cv_rf = metrics["cross_validation_5fold"]["random_forest"]
    assert "roc_auc" in cv_rf
    assert "f1" in cv_rf
    
    assert "holdout_test_evaluation" in metrics
    holdout = metrics["holdout_test_evaluation"]
    assert "roc_auc" in holdout
    assert "f1_score" in holdout
    assert "precision" in holdout
    assert "recall" in holdout
    assert "confusion_matrix" in holdout
    assert holdout["roc_auc"] > 0.5, "Model must outperform random guess on hold-out set"
