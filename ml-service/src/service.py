"""
Inference Service for Training Outcome Predictions
===================================================
Provides robust, validated model loading and real-time prediction using the
persisted scikit-learn pipeline.
"""

import json
from typing import Optional, Dict, Any
import joblib
import pandas as pd
from fastapi import HTTPException

from src.config import MODEL_PATH, METRICS_PATH, FEATURE_COLUMNS, MODEL_VERSION
from src.schemas import TrainingOutcomePredictionRequest, TrainingOutcomePredictionResponse

class ModelService:
    def __init__(self):
        self._pipeline = None
        self._metrics = None
        self.load_model()

    def load_model(self) -> bool:
        """Loads serialized model and metrics artifacts if they exist on disk."""
        if MODEL_PATH.exists():
            try:
                self._pipeline = joblib.load(MODEL_PATH)
                if METRICS_PATH.exists():
                    with open(METRICS_PATH, "r") as f:
                        self._metrics = json.load(f)
                return True
            except Exception as e:
                print(f"[ModelService] Failed to load model from {MODEL_PATH}: {e}")
                self._pipeline = None
                return False
        return False

    @property
    def is_ready(self) -> bool:
        return self._pipeline is not None

    @property
    def metrics(self) -> Optional[Dict[str, Any]]:
        return self._metrics

    def predict(self, req: TrainingOutcomePredictionRequest) -> TrainingOutcomePredictionResponse:
        """
        Executes real inference through the loaded scikit-learn pipeline.
        Raises 503 if the model is not trained/loaded.
        """
        if not self.is_ready:
            # Re-attempt lazy load in case training just concluded
            if not self.load_model():
                raise HTTPException(
                    status_code=503,
                    detail="Training outcome prediction model is not loaded. Train the model using the training pipeline first."
                )

        # Convert request to single-row DataFrame with explicit feature columns
        input_data = pd.DataFrame([{
            "baseline_proficiency_avg": req.baseline_proficiency_avg,
            "initial_gap_magnitude": req.initial_gap_magnitude,
            "historical_completion_rate": req.historical_completion_rate,
            "diagnostic_assessment_score": req.diagnostic_assessment_score,
            "weekly_engagement_hours": req.weekly_engagement_hours,
            "course_difficulty_level": req.course_difficulty_level,
            "mentor_assigned_flag": req.mentor_assigned_flag,
            "tenure_months": req.tenure_months,
        }])[FEATURE_COLUMNS]

        # Dynamic inference via Pipeline
        prob_success = float(self._pipeline.predict_proba(input_data)[0][1])
        prob_success_rounded = round(prob_success, 4)

        if prob_success >= 0.50:
            predicted_outcome = "SUCCESS"
            predicted_class = 1
        else:
            predicted_outcome = "AT_RISK"
            predicted_class = 0

        # Determine risk classification
        if prob_success >= 0.70:
            risk_level = "LOW"
        elif prob_success >= 0.45:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        provenance = (
            self._metrics.get("data_provenance", {}).get("type", "SYNTHETIC_DEVELOPMENT_DATASET")
            if self._metrics else "SYNTHETIC_DEVELOPMENT_DATASET"
        )

        return TrainingOutcomePredictionResponse(
            predicted_outcome=predicted_outcome,
            predicted_class=predicted_class,
            success_probability=prob_success_rounded,
            risk_level=risk_level,
            model_version=MODEL_VERSION,
            data_provenance=provenance,
            feature_snapshot=req.model_dump()
        )

# Global singleton service instance
model_service = ModelService()
