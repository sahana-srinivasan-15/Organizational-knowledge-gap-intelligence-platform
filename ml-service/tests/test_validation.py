import pytest
from pydantic import ValidationError
from src.schemas import TrainingOutcomePredictionRequest

def test_valid_request():
    payload = {
        "baseline_proficiency_avg": 3.5,
        "initial_gap_magnitude": 2.0,
        "historical_completion_rate": 0.85,
        "diagnostic_assessment_score": 82.0,
        "weekly_engagement_hours": 8.0,
        "course_difficulty_level": 2,
        "mentor_assigned_flag": 1,
        "tenure_months": 18
    }
    req = TrainingOutcomePredictionRequest(**payload)
    assert req.baseline_proficiency_avg == 3.5
    assert req.course_difficulty_level == 2
    assert req.mentor_assigned_flag == 1

def test_invalid_proficiency_range():
    with pytest.raises(ValidationError):
        TrainingOutcomePredictionRequest(
            baseline_proficiency_avg=5.5, # Out of range: max is 5.0
            initial_gap_magnitude=2.0,
            historical_completion_rate=0.8,
            diagnostic_assessment_score=80.0,
            weekly_engagement_hours=5.0,
            course_difficulty_level=2,
            mentor_assigned_flag=1,
            tenure_months=12
        )

def test_invalid_weekly_hours():
    with pytest.raises(ValidationError):
        TrainingOutcomePredictionRequest(
            baseline_proficiency_avg=3.0,
            initial_gap_magnitude=2.0,
            historical_completion_rate=0.8,
            diagnostic_assessment_score=80.0,
            weekly_engagement_hours=45.0, # Exceeds 40.0 hours limit
            course_difficulty_level=2,
            mentor_assigned_flag=1,
            tenure_months=12
        )

def test_invalid_difficulty_level():
    with pytest.raises(ValidationError):
        TrainingOutcomePredictionRequest(
            baseline_proficiency_avg=3.0,
            initial_gap_magnitude=2.0,
            historical_completion_rate=0.8,
            diagnostic_assessment_score=80.0,
            weekly_engagement_hours=5.0,
            course_difficulty_level=4, # Must be 1, 2, or 3
            mentor_assigned_flag=1,
            tenure_months=12
        )
