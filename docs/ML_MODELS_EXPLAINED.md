# Machine Learning & Algorithmic Intelligence Guide

This document provides a rigorous, transparent breakdown of all machine learning models, statistical pipelines, and rule-based algorithms implemented in the **Organizational Knowledge Gap Intelligence Platform**.

---

## 1. Executive Taxonomy: What is Genuine ML vs Rule-Based

To eliminate ambiguity and prevent exaggeration of AI capabilities, the platform's intelligence mechanisms are classified into four distinct categories:

| Category | Component | Technology / Engine | Location | Description |
| :--- | :--- | :--- | :--- | :--- |
| **A. Genuine Machine Learning** | Training Outcome & Risk Prediction | Scikit-Learn `Pipeline` (`StandardScaler` + `LogisticRegression` / `RandomForestClassifier`) | `ml-service/src/train.py`, `ml-service/src/service.py` | Supervised binary classification predicting whether an employee will succeed (`SUCCESS`) or be at risk (`AT_RISK`) in a course. |
| **B. Deterministic Rule-Based Algorithm** | Skill Gap Evaluation Engine | Java 21 / Spring Boot Service | `backend/src/main/java/com/orgkgi/service/SkillGapService.java` | Mathematical formula calculating weighted skill deficits against job role requirements. |
| **B. Deterministic Rule-Based Algorithm** | Dynamic Mentor Matching Engine | Java 21 / Spring Boot Service | `backend/src/main/java/com/orgkgi/service/MentorMatchingService.java` | Multi-factor weighted heuristic scoring candidates on skill overlap, remaining capacity, hours, and department. |
| **B. Deterministic Rule-Based Algorithm** | Course Recommendation & Ranking | Java 21 / Spring Boot Service | `backend/src/main/java/com/orgkgi/service/CourseRecommendationService.java` | Heuristic efficiency scoring ranking courses by proficiency gain per study hour minus difficulty penalty. |
| **C. Database Queries & Relations** | Diagnostic Quiz Safe Delivery | Spring Data JPA / PostgreSQL | `backend/src/main/java/com/orgkgi/service/AssessmentService.java` | SQL/JPA queries filtering out correct answer indexes until submission. |
| **D. Synthetic Demonstration** | ML Training Dataset | Python NumPy / Latent Sigmoid Generator | `ml-service/src/data_generator.py`, `synthetic_training_outcomes_dev.csv` | 1,200 synthetic employee training records with realistic statistical distributions. |

---

## 2. Genuine ML Model: Training Outcome & Risk Predictor

### 2.1 Model Specification & Algorithm
- **Exact Model Name:** `scikit-learn Pipeline` encapsulating `StandardScaler` and `LogisticRegression(C=1.0, max_iter=1000)` (selected over `RandomForestClassifier(n_estimators=100, max_depth=6)` based on 5-fold cross-validation ROC-AUC).
- **Source File:** [ml-service/src/train.py](file:///d:/Rep/ml-service/src/train.py) and [ml-service/src/service.py](file:///d:/Rep/ml-service/src/service.py).
- **Serving Architecture:** Python FastAPI microservice on port `8000`, called synchronously by Spring Boot's `MlPredictionService.java`.
- **Saved Artifact:** [ml-service/model/training_outcome_pipeline.joblib](file:///d:/Rep/ml-service/model/training_outcome_pipeline.joblib) (loaded into memory at microservice boot).
- **Metrics Summary:** [ml-service/model/metrics.json](file:///d:/Rep/ml-service/model/metrics.json).

---

### 2.2 Problem Formulation
- **Objective:** Predict whether an employee who enrolls in a specific corporate training course will successfully complete the course with passing competency verification (`SUCCESS`, Class 1) or struggle/drop out (`AT_RISK`, Class 0).
- **Business Impact:** Prevents wasted corporate training hours and budget by identifying at-risk employees before enrollment, recommending prerequisite quizzes or mandatory mentor pairings.

---

### 2.3 The 8 Input Features

The model evaluates exactly **eight numeric features** prepared by the Spring Boot backend:

| Feature Name | Type | Allowed Range | Source in Database | Practical Meaning |
| :--- | :--- | :--- | :--- | :--- |
| `baseline_proficiency_avg` | `float` | `1.0` to `5.0` | `employee_skills.verified_proficiency_level` | The employee's average verified competency level across relevant technical skills. |
| `initial_gap_magnitude` | `float` | `0.0` to `20.0` | `SkillGapService.generateReport().totalWeightedGap` | Total weighted deficit between the employee's current skills and target role requirements. |
| `historical_completion_rate` | `float` | `0.0` to `1.0` | `learning_paths` & `learning_path_courses` | Ratio of past enrolled courses successfully completed (default `0.75` for new hires). |
| `diagnostic_assessment_score` | `float` | `0.0` to `100.0` | `assessment_submissions.score` | Score achieved on pre-training diagnostic multiple-choice assessment. |
| `weekly_engagement_hours` | `float` | `0.5` to `40.0` | User input override or `employee_profiles.mentor_availability_hrs_per_week` | Dedicated weekly study and code pairing hours. |
| `course_difficulty_level` | `int` | `1` to `3` | `courses.difficulty` (`1` = Beginner, `2` = Intermediate, `3` = Advanced) | Technical depth of the target course curriculum. |
| `mentor_assigned_flag` | `int` | `0` or `1` | `mentor_assignments` (`status = 'ACTIVE'`) | Binary flag: `1` if an approved mentor is actively paired, `0` otherwise. |
| `tenure_months` | `int` | `0` to `360` | `employee_profiles.hire_date` | Organizational tenure in months. |

---

### 2.4 Expected Output & Threshold Calibration
FastAPI endpoint `POST /api/v1/predict/outcome` returns:
```json
{
  "predicted_outcome": "SUCCESS",
  "predicted_class": 1,
  "success_probability": 0.8425,
  "risk_level": "LOW",
  "model_version": "v1.0.0-dev",
  "data_provenance": "SYNTHETIC_DEVELOPMENT_DATASET",
  "feature_snapshot": { ... }
}
```

#### Risk Level Mapping
The continuous calibrated probability $P(\text{SUCCESS})$ is categorized into risk bands:
- **$P \ge 0.70$:** `risk_level: "LOW"` (Strong likelihood of completion; employee cleared for self-directed study).
- **$0.45 \le P < 0.70$:** `risk_level: "MEDIUM"` (Moderate risk; recommend assigning a mentor or increasing weekly study hours).
- **$P < 0.45$:** `risk_level: "HIGH"` (High risk of dropout; mandatory diagnostic assessment review and senior mentor required).

---

### 2.5 Training Dataset Provenance & Data Generation
- **Source:** Generated synthetically via [ml-service/src/data_generator.py](file:///d:/Rep/ml-service/src/data_generator.py).
- **File:** `ml-service/data/synthetic_training_outcomes_dev.csv` (1,200 rows).
- **Generation Method:** Latent log-odds modeling with corporate distributions:
  $$\text{Latent Score} = -1.35 + 0.30(\text{baseline} - 2.8) - 0.24(\text{gap} - 4.5) + 1.40(\text{hist\_rate} - 0.65) + 0.040(\text{diagnostic} - 60) + 0.18(\text{hours} - 7.0) - 0.65(\text{difficulty} - 2) + 0.85(\text{mentor} - 0.42) + 0.015(\text{tenure} - 24)$$
  $$P(\text{Success}) = \frac{1}{1 + e^{-\text{Latent Score}}}$$
- **Class Distribution:** 752 At-Risk samples (`0`), 448 Success samples (`1`).
- **Transparency Statement:** This dataset is **synthetic** and designed for local development and deterministic regression testing. It must not be cited as real-world production performance.

---

### 2.6 Training Process & Evaluation Metrics

The training pipeline ([train.py](file:///d:/Rep/ml-service/src/train.py)):
1. Partitions data into **80% training (960 samples)** and **20% hold-out test set (240 samples)** using stratified splitting.
2. Embeds `StandardScaler` strictly inside each Scikit-Learn `Pipeline` to prevent data leakage during cross-validation.
3. Evaluates candidates using **Stratified 5-Fold Cross Validation**:
   - **Logistic Regression CV ROC-AUC:** $0.9538 \pm 0.0222$ (Selected Model)
   - **Random Forest CV ROC-AUC:** $0.9277 \pm 0.0223$
4. Evaluates the winning model on the unseen hold-out test set:
   - **Hold-out Accuracy:** $93.33\%$
   - **Hold-out ROC-AUC:** $0.9827$
   - **Hold-out Precision:** $91.11\%$
   - **Hold-out Recall:** $91.11\%$
   - **Hold-out F1-Score:** $91.11\%$
   - **Confusion Matrix:**
     $$\begin{pmatrix} 142 & 8 \\ 8 & 82 \end{pmatrix}$$
     (142 True Negatives, 8 False Positives, 8 False Negatives, 82 True Positives).

#### Feature Importance & Coefficients (Directional Drivers)
In the winning Logistic Regression model:
- `weekly_engagement_hours`: $+1.9390$ (Strongest positive driver)
- `diagnostic_assessment_score`: $+1.7525$ (High test scores strongly drive success)
- `mentor_assigned_flag`: $+1.2413$ (Having a mentor dramatically boosts completion odds)
- `baseline_proficiency_avg`: $+0.8531$ (Prior skills assist learning)
- `historical_completion_rate`: $+0.7668$ (Past completion track record is predictive)
- `tenure_months`: $+0.4039$ (Company experience provides slight advantage)
- `course_difficulty_level`: $-1.4734$ (Advanced courses increase risk)
- `initial_gap_magnitude`: $-2.2299$ (Massive skill gaps are the strongest driver of failure)

---

### 2.7 Worked Numerical Example

#### Employee Profile: David Kim
- Target Role: *Senior Software Engineer*
- Target Course: *Spring Boot Microservices in Practice* (Difficulty: Intermediate = `2`)
- Baseline Proficiency: `2.0`
- Initial Gap Magnitude: `5.0`
- Historical Completion Rate: `0.75`
- Diagnostic Quiz Score: `80.0`
- Weekly Study Hours: `10.0`
- Mentor Assigned: `1` (Alex Vance assigned)
- Tenure: `9 months`

#### Pipeline Inference Step-by-Step:
1. **Feature Scaling:** The 8 raw features are standardized by the pipeline's fitted `StandardScaler` (subtracting mean, dividing by standard deviation).
2. **Linear Dot Product:** Transformed features are multiplied by the model coefficients. Positive contributions from high weekly hours ($+10$), diagnostic score ($80\%$), and mentor presence ($1$) outweigh the negative penalty from the skill gap ($5.0$).
3. **Sigmoid Mapping:**
   $$z \approx 1.29 \implies P(\text{SUCCESS}) = \frac{1}{1 + e^{-1.29}} \approx 0.7841 \text{ (78.4\%)}$$
4. **Result:** `predicted_outcome: "SUCCESS"`, `risk_level: "LOW"`.

---

## 3. Rule-Based Algorithms (Not ML)

### 3.1 Skill Gap Evaluation Engine ([SkillGapService.java](file:///d:/Rep/backend/src/main/java/com/orgkgi/service/SkillGapService.java))
- **Type:** Deterministic Domain Formula.
- **Inputs:** `JobRoleSkill` requirements and `EmployeeSkill` verified levels from PostgreSQL.
- **Formula:**
  $$\text{Gap} = \max(0, \text{Required Level} - \text{Verified Level})$$
  $$\text{Weighted Gap} = \text{Gap} \times \text{Importance Weight}$$
  $$\text{Readiness \%} = \left( \frac{\sum \text{Achieved Weighted}}{\sum \text{Required Weighted}} \right) \times 100$$
- **Note:** This is pure mathematical calculation, not an AI prediction.

---

### 3.2 Dynamic Mentor Matching Algorithm ([MentorMatchingService.java](file:///d:/Rep/backend/src/main/java/com/orgkgi/service/MentorMatchingService.java))
- **Type:** Multi-Criteria Heuristic Scoring Algorithm.
- **Constraints:**
  1. No self-mentoring (`candidate.id != mentee.id`).
  2. Candidate must have `status == ACTIVE` and `mentor_opt_in == TRUE`.
  3. Workload capacity check: $\text{Current Mentees} < \text{Max Mentees}$.
  4. Candidate verified skill level must be strictly greater than mentee's current level ($C_{\text{level}} > M_{\text{level}}$).
- **Composite Score Formula:**
  $$\text{Score} = (0.50 \times \text{Skill Match}) + (0.25 \times \text{Remaining Capacity Ratio}) + (0.15 \times \text{Availability Ratio}) + (0.10 \times \text{Same Department Bonus})$$
- **Note:** This is an operational optimization algorithm, not a machine learning model.

---

### 3.3 Course Recommendation Algorithm ([CourseRecommendationService.java](file:///d:/Rep/backend/src/main/java/com/orgkgi/service/CourseRecommendationService.java))
- **Type:** Rule-Based Efficiency Ranking.
- **Logic:**
  1. Filters out courses already completed in past learning paths.
  2. Finds courses that teach skills where the employee has an active gap.
  3. Computes expected proficiency gain.
  4. Ranks courses by gain divided by study duration, applying a penalty if an advanced course is chosen when the employee is at beginner level.
- **Note:** This is a deterministic expert rule engine, not collaborative filtering or matrix factorization ML.
