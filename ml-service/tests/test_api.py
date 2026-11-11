import pytest
from fastapi.testclient import TestClient
from main import app
from src.service import model_service

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ml-service"
    assert "model_loaded" in data

def test_metrics_endpoint():
    response = client.get("/api/v1/metrics")
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "data_provenance" in data
        assert "cross_validation_5fold" in data
        assert "holdout_test_evaluation" in data

def test_predict_outcome_endpoint():
    # Ensure model is trained and loaded
    if not model_service.is_ready:
        train_res = client.post("/api/v1/train")
        assert train_res.status_code == 200

    payload = {
        "baseline_proficiency_avg": 3.8,
        "initial_gap_magnitude": 1.5,
        "historical_completion_rate": 0.90,
        "diagnostic_assessment_score": 85.0,
        "weekly_engagement_hours": 10.0,
        "course_difficulty_level": 2,
        "mentor_assigned_flag": 1,
        "tenure_months": 24
    }

    response = client.post("/api/v1/predict/outcome", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_outcome" in data
    assert data["predicted_outcome"] in ["SUCCESS", "AT_RISK"]
    assert "success_probability" in data
    assert 0.0 <= data["success_probability"] <= 1.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert data["data_provenance"] == "SYNTHETIC_DEVELOPMENT_DATASET"

def test_predict_invalid_payload_fails():
    invalid_payload = {
        "baseline_proficiency_avg": 10.0, # Invalid: max 5.0
        "initial_gap_magnitude": 2.0,
    }
    response = client.post("/api/v1/predict/outcome", json=invalid_payload)
    assert response.status_code == 422 # Unprocessable Entity
