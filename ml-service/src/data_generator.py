"""
Synthetic Development Dataset Generator
=========================================
PROVENANCE DECLARATION:
This module generates a reproducible synthetic training outcome dataset specifically
for development, local testing, and baseline model validation when real historical corporate
training logs are not yet accumulated in PostgreSQL.

Never present these synthetic evaluation metrics as production real-world performance.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from src.config import DATA_PATH, DATA_DIR

def generate_synthetic_dataset(
    n_samples: int = 1200,
    random_state: int = 42,
    output_path: Path = DATA_PATH
) -> pd.DataFrame:
    """
    Generates a realistic synthetic corporate training outcome dataset.

    Features:
    - baseline_proficiency_avg: Employee's prior verified skill level (1.0 to 5.0)
    - initial_gap_magnitude: Weighted skill gap before training (0.0 to 15.0)
    - historical_completion_rate: Prior track record on corporate courses (0.0 to 1.0)
    - diagnostic_assessment_score: Score on pre-course diagnostic MCQ (0.0 to 100.0)
    - weekly_engagement_hours: Self-directed hours per week spent learning (0.5 to 30.0)
    - course_difficulty_level: 1 (Beginner), 2 (Intermediate), 3 (Advanced)
    - mentor_assigned_flag: 1 if manager approved active mentor, 0 otherwise
    - tenure_months: Employee company tenure in months (1 to 120)

    Target:
    - completion_outcome: 1 = SUCCESS (completed on schedule with passing score), 0 = AT_RISK
    """
    np.random.seed(random_state)

    # 1. Generate independent features with realistic distributions
    baseline = np.clip(np.random.normal(loc=2.8, scale=0.8, size=n_samples), 1.0, 5.0)
    gap = np.clip(np.random.gamma(shape=3.0, scale=1.5, size=n_samples), 0.5, 15.0)
    hist_rate = np.clip(np.random.beta(a=5.0, b=2.5, size=n_samples), 0.05, 1.0)
    
    # Diagnostic score correlates with baseline proficiency + random noise
    diagnostic = np.clip(30.0 + (baseline * 10.0) + np.random.normal(loc=15.0, scale=12.0, size=n_samples), 15.0, 100.0)
    weekly_hours = np.clip(np.random.normal(loc=7.0, scale=3.5, size=n_samples), 0.5, 30.0)
    difficulty = np.random.choice([1, 2, 3], size=n_samples, p=[0.30, 0.45, 0.25])
    mentor = np.random.binomial(n=1, p=0.42, size=n_samples)
    tenure = np.clip(np.random.exponential(scale=24.0, size=n_samples).astype(int) + 2, 1, 120)

    # 2. Formulate latent log-odds of training success
    # Positive contributors: diagnostic score, weekly engagement, mentor presence, prior completion rate
    # Negative contributors: large skill gap, high course difficulty
    latent = (
        -1.35
        + (0.30 * (baseline - 2.8))
        - (0.24 * (gap - 4.5))
        + (1.40 * (hist_rate - 0.65))
        + (0.040 * (diagnostic - 60.0))
        + (0.16 * (weekly_hours - 7.0))
        - (0.55 * (difficulty - 2.0))
        + (0.75 * mentor)
        + (0.005 * (tenure - 24.0))
        + np.random.normal(loc=0.0, scale=0.45, size=n_samples) # Realistic irreducible noise
    )

    # Convert to probability via sigmoid function
    prob = 1.0 / (1.0 + np.exp(-latent))
    outcome = (prob >= 0.50).astype(int)

    df = pd.DataFrame({
        "baseline_proficiency_avg": np.round(baseline, 2),
        "initial_gap_magnitude": np.round(gap, 2),
        "historical_completion_rate": np.round(hist_rate, 3),
        "diagnostic_assessment_score": np.round(diagnostic, 1),
        "weekly_engagement_hours": np.round(weekly_hours, 1),
        "course_difficulty_level": difficulty,
        "mentor_assigned_flag": mentor,
        "tenure_months": tenure,
        "completion_outcome": outcome,
    })

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return df

if __name__ == "__main__":
    df = generate_synthetic_dataset()
    print(f"Generated synthetic development dataset: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Outcome balance:\n{df['completion_outcome'].value_counts(normalize=True)}")
