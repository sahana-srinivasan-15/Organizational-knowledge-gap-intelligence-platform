from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class TrainingOutcomePredictionRequest(BaseModel):
    baseline_proficiency_avg: float = Field(
        ..., ge=1.0, le=5.0,
        description="Average verified baseline proficiency of employee across relevant skills (scale 1.0 to 5.0)"
    )
    initial_gap_magnitude: float = Field(
        ..., ge=0.0, le=20.0,
        description="Total weighted skill deficit between employee verified proficiency and target job role"
    )
    historical_completion_rate: float = Field(
        ..., ge=0.0, le=1.0,
        description="Historical ratio of assigned courses/learning paths successfully completed (0.0 to 1.0)"
    )
    diagnostic_assessment_score: float = Field(
        ..., ge=0.0, le=100.0,
        description="Pre-training diagnostic assessment quiz score (scale 0.0 to 100.0)"
    )
    weekly_engagement_hours: float = Field(
        ..., ge=0.0, le=40.0,
        description="Dedicated weekly learning / study hours logged by the employee (0 to 40)"
    )
    course_difficulty_level: int = Field(
        ..., ge=1, le=3,
        description="Difficulty level of the enrolled course: 1 = Beginner, 2 = Intermediate, 3 = Advanced"
    )
    mentor_assigned_flag: int = Field(
        ..., ge=0, le=1,
        description="Binary flag indicating whether a verified mentor is actively paired for this training (0 or 1)"
    )
    tenure_months: int = Field(
        ..., ge=0, le=360,
        description="Employee organizational tenure in months"
    )

class TrainingOutcomePredictionResponse(BaseModel):
    predicted_outcome: str = Field(..., description="Binary classification label: 'SUCCESS' or 'AT_RISK'")
    predicted_class: int = Field(..., description="1 for SUCCESS, 0 for AT_RISK")
    success_probability: float = Field(..., ge=0.0, le=1.0, description="Calibrated model probability of success")
    risk_level: str = Field(..., description="Categorical risk assessment: 'LOW', 'MEDIUM', or 'HIGH'")
    model_version: str = Field(..., description="Identifier of the serving model pipeline")
    data_provenance: str = Field(..., description="Provenance declaration of the training dataset")
    feature_snapshot: Dict[str, Any] = Field(..., description="Echo of input features evaluated by the model")

class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    model_version: str
    environment: str

class TrainResponse(BaseModel):
    status: str
    message: str
    model_selected: str
    metrics: Dict[str, Any]

class CertificateVerificationRequest(BaseModel):
    course_title: str
    course_provider: Optional[str] = "Coursera"
    course_slug: Optional[str] = None
    credential_url: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = 0
    file_mime_type: Optional[str] = None
    completion_date: Optional[str] = None

class CertificateVerificationResponse(BaseModel):
    is_authentic: bool
    authenticity_score: float
    confidence: str
    status: str
    model_version: str
    verification_details: Dict[str, Any]
    message: str

