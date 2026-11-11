"""
Training Pipeline for Employee Training Outcome Prediction
===========================================================
Trains and compares a Random Forest Classifier against a Logistic Regression baseline
using Stratified 5-Fold Cross Validation. Evaluates on a hold-out test set without data leakage.
Saves reproducible model and metrics artifacts.
"""

import json
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    roc_auc_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

from src.config import (
    DATA_PATH,
    MODEL_PATH,
    METRICS_PATH,
    MODEL_DIR,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    MODEL_VERSION
)
from src.data_generator import generate_synthetic_dataset

def load_or_create_dataset() -> pd.DataFrame:
    """Loads the training dataset or generates the synthetic development set if missing."""
    if not DATA_PATH.exists():
        print(f"[Provenance] Dataset not found at {DATA_PATH}. Generating synthetic development dataset...")
        return generate_synthetic_dataset(n_samples=1200, random_state=42, output_path=DATA_PATH)
    return pd.read_csv(DATA_PATH)

def train_and_evaluate(random_state: int = 42) -> dict:
    """
    Executes the training and cross-validation pipeline.
    Prevents data leakage by strictly encapsulating scaling inside scikit-learn Pipelines.
    """
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    df = load_or_create_dataset()

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    total_samples = len(df)
    class_counts = y.value_counts().to_dict()

    # Stratified 80/20 train/test split before any fitting or scaling
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=random_state
    )

    # 1. Define Candidate Pipelines (Encapsulating StandardScaler to prevent leakage)
    lr_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(C=1.0, max_iter=1000, random_state=random_state))
    ])

    rf_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=6, random_state=random_state))
    ])

    # 2. Stratified 5-Fold Cross Validation on Training Split
    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    scoring = ['accuracy', 'roc_auc', 'f1', 'precision', 'recall']

    print(f"Executing Stratified 5-Fold Cross Validation on {len(X_train)} training samples...")
    lr_cv_results = cross_validate(lr_pipeline, X_train, y_train, cv=cv_strategy, scoring=scoring)
    rf_cv_results = cross_validate(rf_pipeline, X_train, y_train, cv=cv_strategy, scoring=scoring)

    lr_cv_summary = {
        metric: {
            "mean": float(np.round(np.mean(lr_cv_results[f"test_{metric}"]), 4)),
            "std": float(np.round(np.std(lr_cv_results[f"test_{metric}"]), 4)),
        } for metric in scoring
    }

    rf_cv_summary = {
        metric: {
            "mean": float(np.round(np.mean(rf_cv_results[f"test_{metric}"]), 4)),
            "std": float(np.round(np.std(rf_cv_results[f"test_{metric}"]), 4)),
        } for metric in scoring
    }

    # 3. Model Selection based on Cross-Validation ROC-AUC & F1
    if rf_cv_summary['roc_auc']['mean'] >= lr_cv_summary['roc_auc']['mean']:
        selected_name = "RandomForestClassifier"
        selected_pipeline = rf_pipeline
        winning_cv = rf_cv_summary
    else:
        selected_name = "LogisticRegression"
        selected_pipeline = lr_pipeline
        winning_cv = lr_cv_summary

    # 4. Fit the winning pipeline on full training set
    selected_pipeline.fit(X_train, y_train)

    # 5. Evaluate on Hold-out Test Set (Unseen data)
    y_pred = selected_pipeline.predict(X_test)
    y_pred_proba = selected_pipeline.predict_proba(X_test)[:, 1]

    test_accuracy = float(np.round(accuracy_score(y_test, y_pred), 4))
    test_roc_auc = float(np.round(roc_auc_score(y_test, y_pred_proba), 4))
    test_precision = float(np.round(precision_score(y_test, y_pred, zero_division=0), 4))
    test_recall = float(np.round(recall_score(y_test, y_pred, zero_division=0), 4))
    test_f1 = float(np.round(f1_score(y_test, y_pred, zero_division=0), 4))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature Importance extraction
    feature_importance = {}
    if selected_name == "RandomForestClassifier":
        rf_model = selected_pipeline.named_steps['classifier']
        for feat, imp in zip(FEATURE_COLUMNS, rf_model.feature_importances_):
            feature_importance[feat] = float(np.round(imp, 4))
    elif selected_name == "LogisticRegression":
        lr_model = selected_pipeline.named_steps['classifier']
        for feat, coef in zip(FEATURE_COLUMNS, lr_model.coef_[0]):
            feature_importance[feat] = float(np.round(coef, 4))

    # 6. Save Artifacts
    joblib.dump(selected_pipeline, MODEL_PATH)

    metrics_payload = {
        "model_version": MODEL_VERSION,
        "selected_model": selected_name,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "data_provenance": {
            "type": "SYNTHETIC_DEVELOPMENT_DATASET",
            "description": "Reproducible synthetic dataset generated via latent sigmoid modeling with corporate feature distributions for local development and integration testing.",
            "disclaimer": "These metrics are evaluated on synthetic development data and MUST NOT be represented as real-world production accuracy.",
            "total_samples": total_samples,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "class_distribution": class_counts
        },
        "cross_validation_5fold": {
            "strategy": "StratifiedKFold(n_splits=5, shuffle=True, random_state=42)",
            "random_forest": rf_cv_summary,
            "logistic_regression": lr_cv_summary
        },
        "holdout_test_evaluation": {
            "test_samples": len(X_test),
            "accuracy": test_accuracy,
            "roc_auc": test_roc_auc,
            "precision": test_precision,
            "recall": test_recall,
            "f1_score": test_f1,
            "confusion_matrix": {
                "format": "[[True Negative (AT_RISK), False Positive (Predicted SUCCESS)], [False Negative (Predicted AT_RISK), True Positive (SUCCESS)]]",
                "matrix": cm
            }
        },
        "feature_importance": feature_importance,
        "feature_schema": FEATURE_COLUMNS
    }

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\n==================================================================")
    print(f"Model Training Complete!")
    print(f"Selected Model: {selected_name}")
    print(f"CV 5-Fold ROC-AUC: {winning_cv['roc_auc']['mean']} +/- {winning_cv['roc_auc']['std']}")
    print(f"Hold-out Test ROC-AUC: {test_roc_auc}")
    print(f"Hold-out Test F1-Score: {test_f1}")
    print(f"Hold-out Confusion Matrix: {cm}")
    print(f"Model saved to: {MODEL_PATH}")
    print(f"Metrics saved to: {METRICS_PATH}")
    print(f"==================================================================\n")

    return metrics_payload

if __name__ == "__main__":
    train_and_evaluate()
