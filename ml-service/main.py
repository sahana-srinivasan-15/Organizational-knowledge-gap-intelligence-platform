from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from src.config import ENVIRONMENT, MODEL_VERSION, PORT, HOST
from src.schemas import (
    HealthResponse,
    TrainingOutcomePredictionRequest,
    TrainingOutcomePredictionResponse,
    TrainResponse,
    CertificateVerificationRequest,
    CertificateVerificationResponse
)
from src.service import model_service
from src.certificate_authenticity import certificate_verifier
from src.train import train_and_evaluate

app = FastAPI(
    title="Organizational Knowledge Gap Intelligence - ML Service",
    description="Microservice providing evaluated machine learning predictions for employee training outcomes.",
    version=MODEL_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
def read_root():
    return {
        "service": "Organizational Knowledge Gap Intelligence Platform - ML Service",
        "status": "online",
        "documentation": "/docs",
        "model_loaded": model_service.is_ready,
        "version": MODEL_VERSION
    }

@app.get("/health", response_model=HealthResponse, tags=["General"])
def health_check():
    """
    Returns service health, deployment environment, and model loading status.
    """
    return HealthResponse(
        status="healthy",
        service="ml-service",
        model_loaded=model_service.is_ready,
        model_version=MODEL_VERSION,
        environment=ENVIRONMENT
    )

@app.post(
    "/api/v1/predict/outcome",
    response_model=TrainingOutcomePredictionResponse,
    tags=["Prediction"]
)
def predict_training_outcome(request: TrainingOutcomePredictionRequest):
    """
    Predicts whether an employee is likely to succeed or be at-risk in a training program
    based on baseline skills, gap magnitude, diagnostic test score, weekly study hours,
    course difficulty, mentor status, and tenure.
    """
    return model_service.predict(request)

@app.post(
    "/api/v1/verify/certificate",
    response_model=CertificateVerificationResponse,
    tags=["Certificate Verification"]
)
def verify_course_certificate(request: CertificateVerificationRequest):
    """
    Evaluates course completion certificate authenticity using an ML classifier
    trained on multi-dimensional authenticity features (domain signatures,
    cryptographic credential formats, document structure, and temporal validity).
    """
    return certificate_verifier.verify(request)

@app.get("/api/v1/metrics", tags=["Model Analytics"])
def get_model_evaluation_metrics():
    """
    Returns authentic evaluation metrics from cross-validation and hold-out testing,
    explicitly declaring dataset provenance.
    """
    if model_service.metrics is None:
        # Attempt to load if file exists
        model_service.load_model()

    if model_service.metrics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation metrics not found. Train the model first."
        )

    return model_service.metrics

@app.post("/api/v1/train", response_model=TrainResponse, tags=["Model Operations"])
def trigger_training():
    """
    Triggers model training, cross-validation, and metrics generation on demand.
    Updates the active model in memory.
    """
    try:
        metrics = train_and_evaluate()
        model_service.load_model()
        return TrainResponse(
            status="success",
            message="Model successfully trained, evaluated, and loaded into service.",
            model_selected=metrics.get("selected_model", "Unknown"),
            metrics=metrics.get("holdout_test_evaluation", {})
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
