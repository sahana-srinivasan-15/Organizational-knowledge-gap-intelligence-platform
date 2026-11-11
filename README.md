# Organizational Knowledge Gap Intelligence Platform

An enterprise-grade talent intelligence platform designed to identify organizational skill gaps, generate tailored learning pathways, match employees with dynamic mentors, and predict training outcomes using evaluated Machine Learning.

---

## Architecture Overview

- **Frontend**: React 18 + Vite (Vanilla CSS Design System, Recharts, Lucide Icons) on port `5173`.
- **Backend**: Java 21 + Spring Boot 3.3 (Spring Security 6, Stateless JWT, Spring Data JPA, Flyway) on port `8080`.
- **Database**: PostgreSQL 16 (running via Docker Compose or native) on port `5432`.
- **Machine Learning Service**: Python 3.11+ / 3.14 + FastAPI + scikit-learn on port `8000`.

---

## Directory Structure

```text
.
├── .env.example               # Environment variables template
├── .gitignore                 # Root Git ignore rules
├── docker-compose.yml         # Local PostgreSQL container service
├── README.md                  # Project overview and setup instructions
├── backend/                   # Spring Boot 3.3 (Java 21) REST API
│   ├── .mvn/                  # Maven Wrapper directory
│   ├── mvnw / mvnw.cmd        # Cross-platform Maven wrapper scripts
│   ├── pom.xml                # Backend dependencies and plugins
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/orgkgi/ # Application source code
│   │   │   └── resources/     # application.yml and db/migration
│   │   └── test/              # Unit and integration tests
├── frontend/                  # React 18 + Vite SPA
│   ├── index.html             # HTML entry point with modern typography
│   ├── package.json           # Frontend dependencies and scripts
│   ├── vite.config.js         # Vite configuration (port 5173)
│   ├── public/                # Static assets
│   └── src/                   # React components, pages, design system
└── ml-service/                # Python + FastAPI + scikit-learn ML microservice
    ├── requirements.txt       # ML service dependencies
    ├── main.py                # FastAPI entry point & health check
    ├── model/                 # Model artifact storage directory
    └── src/                   # Feature extraction, training, schemas
```

---

## Getting Started

### Prerequisites
1. **Java Development Kit (JDK 21 or higher)**
2. **Node.js (v20+ or v22+) & npm**
3. **Python (3.11+) & pip**
4. **Docker & Docker Compose** (or local PostgreSQL 15/16 instance)

### 1. Environment Configuration
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```

### 2. Start PostgreSQL Database
Using Docker Compose:
```bash
docker compose up -d
```
The database will be accessible at `localhost:5432` with database name `knowledge_gap_db`.

### 3. Start Backend Service (Spring Boot)
Navigate to `backend`:
```bash
cd backend
# Windows
.\mvnw.cmd spring-boot:run
# Linux/macOS
./mvnw spring-boot:run
```
Backend will start on `http://localhost:8080`.
API documentation will be available at `http://localhost:8080/swagger-ui.html`.

### 4. Start Machine Learning Service (FastAPI)
Navigate to `ml-service`:
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
ML Service health check will be accessible at `http://localhost:8000/health`.

### 5. Start Frontend Application (React + Vite)
Navigate to `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will start on `http://localhost:5173`.

---

## User Roles & Access Control
The platform strictly implements three login roles:
1. **`ADMIN`**: User management, skill taxonomy curation, course catalog, organizational audit logs.
2. **`MANAGER`**: Team skill matrix, assessment verification, mentor recommendation approvals, team progress tracking.
3. **`EMPLOYEE`**: Personal skill inventory, self-assessment, gap analysis radar, learning path progression, mentorship opt-in & mentor pairing.

*Note: In accordance with architectural principles, there is no separate Mentor login role or login page. Employees dynamically opt-in and qualify as mentors based on verified proficiencies, workload capacity, and availability.*

---

## Database Schema & Flyway Migrations

Database schema migrations are strictly managed using **Flyway**. Hibernate/JPA is configured with `ddl-auto: validate` so that Flyway remains the single source of truth for all schema modifications.

### Migration Order

| Migration Script | Type | Description |
|---|---|---|
| `V1__init_schema.sql` | Schema DDL | Creates all 19 normalized tables, foreign keys, unique constraints, check constraints, and performance indexes. |
| `V2__seed_dev_data.sql` | Seed Data | Inserts isolated, realistic development/demo data with BCrypt-hashed credentials and resets sequence counters. |

### Core Relational Entities

1. **`departments`**: Organizational units (`Engineering`, `Data & AI`, `Product & Design`) with manager references.
2. **`job_roles`**: Positions tied to departments with hierarchical levels (`JUNIOR`, `MID`, `SENIOR`).
3. **`users`**: Authentication credentials with strict RBAC check constraint (`role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')`).
4. **`employee_profiles`**: Extended profile containing current role, target role (creating skill gaps), and dynamic mentorship attributes (`mentor_opt_in`, `mentor_availability_hrs_per_week`, `current_mentee_count`, `max_mentees`).
5. **`skill_categories` & `skills`**: Normalized taxonomy of technical capabilities.
6. **`job_role_skills`**: Required proficiency levels (1-5) and importance weights (1.0 Elective, 2.0 Core, 3.0 Mandatory) per role.
7. **`employee_skills`**: Real proficiency records with verification status (`SELF_REPORTED`, `ASSESSED`, `MANAGER_VERIFIED`).
8. **`assessments`, `assessment_questions`, `assessment_submissions`**: Quiz-based skill assessment engine.
9. **`mentor_assignments`**: Dynamic mentor pairing records with lifecycle states (`RECOMMENDED`, `REQUESTED`, `APPROVED_BY_MANAGER`, `ACTIVE`, `COMPLETED`, `REJECTED`).
10. **`courses` & `course_skills`**: Learning catalog and expected proficiency gains per skill.
11. **`learning_paths` & `learning_path_courses`**: Sequenced curriculums with progress tracking for employees targeting new roles.
12. **`training_predictions`**: Persisted machine learning outcome predictions (`SUCCESS` vs `AT_RISK`), probabilities, and feature snapshots.
13. **`notifications`**: User alerts for mentor recommendations, assessment deadlines, and risk flags.
14. **`audit_logs`**: System audit trail recording security and domain events.

### Development Demo Accounts

All development seed accounts are secured with BCrypt (`Password@123`):

| Email | Role | Department | Persona / Capabilities |
|---|---|---|---|
| `admin@orgkgi.dev` | `ADMIN` | Engineering | System Administrator with full catalog and audit visibility |
| `manager.eng@orgkgi.dev` | `MANAGER` | Engineering | Sarah Jenkins: Engineering Manager with mentor approval authority |
| `alex.senior@orgkgi.dev` | `EMPLOYEE` | Engineering | Alex Morgan: Senior SWE, verified mentor candidate (5 hrs/wk available) |
| `david.junior@orgkgi.dev` | `EMPLOYEE` | Engineering | David Kim: Junior SWE targeting Senior role (has active skill gaps) |
| `elena.ai@orgkgi.dev` | `EMPLOYEE` | Data & AI | Elena Rostova: ML Engineer, verified Python & ML mentor candidate |

### Validating Migrations

To run the automated Flyway migration test against the database:
```bash
cd backend
.\mvnw.cmd test -Dtest=DatabaseMigrationTest
```

---

## Machine Learning Service (FastAPI + scikit-learn)

The platform incorporates an evaluated machine learning microservice that predicts employee training outcomes (`SUCCESS` vs `AT_RISK`) and outputs calibrated success probabilities with risk categorizations (`LOW`, `MEDIUM`, `HIGH`).

### Features & Model Architecture
- **Evaluated Models**: Random Forest Classifier evaluated against a Logistic Regression baseline using **Stratified 5-Fold Cross-Validation** ($N=960$ training samples).
- **Leakage Prevention**: Data preprocessing (standardization via `StandardScaler`) is encapsulated entirely inside scikit-learn `Pipeline` objects.
- **Evaluation Dataset**: A 20% holdout test set ($N=240$) unseen during training or cross-validation.
- **Evaluated Features (8 features)**:
  1. `baseline_proficiency_avg`: Employee verified skill proficiency baseline (1.0 to 5.0).
  2. `initial_gap_magnitude`: Weighted skill deficit relative to target job role.
  3. `historical_completion_rate`: Historical course completion ratio (0.0 to 1.0).
  4. `diagnostic_assessment_score`: Pre-training diagnostic quiz score (0.0 to 100.0).
  5. `weekly_engagement_hours`: Logged weekly study hours (0.5 to 40.0).
  6. `course_difficulty_level`: 1 (Beginner), 2 (Intermediate), 3 (Advanced).
  7. `mentor_assigned_flag`: Binary indicator (1 if active mentor is assigned, 0 otherwise).
  8. `tenure_months`: Employee organizational tenure in months.

### Data Provenance & Synthetic Disclaimer
> **Important**: In initial development environments prior to the accumulation of long-term corporate completion records in PostgreSQL, the model is trained on a reproducible synthetic development dataset (`data/synthetic_training_outcomes_dev.csv`, $N=1,200$) generated using realistic organizational distributions and latent log-odds modeling (`src/data_generator.py`). **Synthetic-data metrics are for development and testing only and are never represented as real-world production performance.** When production logs accrue, the model can be retrained on live business records via `POST /api/v1/train`.

### ML Commands
```bash
cd ml-service

# 1. Install dependencies
pip install -r requirements.txt

# 2. Train model, run 5-fold cross validation, and save artifacts
python -m src.train

# 3. Run unit tests
python -m pytest tests/ -v

# 4. Start ML service on port 8000
python -m uvicorn main:app --reload --port 8000
```

### Endpoints
- `GET /health`: Service health and model readiness status.
- `POST /api/v1/predict/outcome`: Validated prediction returning outcome class, probability, risk level, and feature snapshot.
- `GET /api/v1/metrics`: Authentic evaluation metrics (5-fold CV scores, holdout metrics, confusion matrix, feature importances, and dataset provenance).
- `POST /api/v1/train`: On-demand model retraining and in-memory reload.

---

## Backend Core & RBAC Security (Spring Boot + JWT)

The backend service is built with **Spring Boot 3.3.4** and **Java 21**, utilizing **Spring Data JPA**, **Spring Security 6**, and **JJWT (0.12.6)** for stateless token-based authorization.

### Security Architecture & RBAC Boundary

Authentication and authorization strictly enforce three roles:
1. **`ADMIN`**: Full administrative access across all organizational departments, user account lifecycle management (`ACTIVE`, `INACTIVE`, `SUSPENDED`), and role assignments.
2. **`MANAGER`**: Scoped administrative access restricted to employees within their authorized department (`user.department.id == principal.departmentId`). Cannot access cross-department employees.
3. **`EMPLOYEE`**: Self-service access restricted to their own user records and talent profiles (`user.id == principal.id`). Cross-employee access attempts are rejected with HTTP `403 Forbidden`.

> **Mentorship Security Note**: In strict adherence to system design, **mentorship is not a role**. Mentorship is an employee capability managed via `mentor_opt_in`, weekly availability, and workload capacity (`current_mentee_count < max_mentees`). There is no `ROLE_MENTOR` and no mentor login portal.

### Security Components

- **`JwtTokenProvider`**: HMAC-SHA256 signed token generation and validation using keys supplied via `APP_JWT_SECRET`. Gracefully handles expired, malformed, or tampered signatures without leaking stack traces.
- **`JwtAuthenticationFilter`**: Stateless per-request filter extracting Bearer tokens and establishing Spring `SecurityContextHolder`.
- **`SecurityUtils`**: Centralized authorization enforcement validating ownership and department tenancy boundaries.
- **`GlobalExceptionHandler`**: Standardized JSON error response structure (`ApiResponse` / `ErrorResponse`) returning HTTP 400 for validation errors, HTTP 401 for bad credentials / expired tokens, HTTP 403 for unauthorized cross-access, and HTTP 404 for missing resources. Passwords and token secrets are excluded from all logs.

### Core REST Endpoints (Phase 4)

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and returns signed JWT access token |
| `GET` | `/api/v1/users/me` | Authenticated | Retrieves authenticated user identity, role, and department |
| `GET` | `/api/v1/users/{id}` | Self / Manager / Admin | Retrieves user record with department & ownership checks |
| `GET` | `/api/v1/employees/me/profile` | Authenticated | Retrieves current employee's talent profile and verified skills |
| `PUT` | `/api/v1/employees/me/profile` | Authenticated | Self-service profile updates (mentor opt-in, availability, target role) |
| `GET` | `/api/v1/employees/{userId}/profile` | Manager / Admin | Retrieves employee profile by ID (enforcing department scope) |
| `GET` | `/api/v1/admin/users` | `ADMIN` Only | Paged user listing with optional filtering by role and department |
| `PATCH`| `/api/v1/admin/users/{id}/status` | `ADMIN` Only | Updates user status (`ACTIVE`, `INACTIVE`, `SUSPENDED`) |
| `PATCH`| `/api/v1/admin/users/{id}/role` | `ADMIN` Only | Updates user role (`ADMIN`, `MANAGER`, `EMPLOYEE`) |

### Mass Assignment Prevention
Self-service profile updates (`PUT /api/v1/employees/me/profile`) strictly accept a dedicated DTO (`UpdateEmployeeProfileRequest`), preventing unauthorized tampering with privileged attributes such as `current_job_role_id`, `verification_status`, `role`, or `status`.

### Automated Test Verification (Phase 4)

The backend includes an automated security and RBAC test suite:
- `AuthIntegrationTest`: 6 tests (Admin/Manager/Employee login, wrong credentials, bad email, empty DTO validation)
- `SecurityAuthorizationTest`: 10 tests (401 unauthenticated, 403 role violations, manager department boundaries, employee ownership)
- `EmployeeProfileSecurityTest`: 5 tests (Self-service updates, negative/excessive hours validation, cross-employee 403)
- `JwtTokenProviderTest`: 4 tests (Valid token generation/parsing, malformed token rejection, expiration validation, null/empty checks)
- `JpaEntityMappingTest`: 4 tests (JPA entity-table bindings, lazy relationships, mentor eligibility calculations)
- `PasswordHashTest`: 1 test (BCrypt verification against seed format)
- `DatabaseMigrationTest`: 1 test (Flyway schema & seed migration against PostgreSQL)

---

## Phase 5: Skill Gap Engine, Dynamic Mentor Matching & ML Integration

Phase 5 introduces the platform's core intelligence: database-driven skill gap arithmetic, an algorithmic dynamic mentor matching engine, manager approval workflows with concurrency controls, and secure integration with the evaluated FastAPI Machine Learning microservice.

### 1. Deterministic Skill Gap Engine

The skill gap engine evaluates an employee's verified proficiencies against the requirements of their target job role.

$$\text{rawGap} = \max(0, \text{requiredProficiency} - \text{verifiedProficiency})$$
$$\text{weightedGap} = \text{rawGap} \times \text{importanceWeight}$$

- **Verified vs. Self-Reported**: Skills with status `MANAGER_VERIFIED` or `ASSESSED` compute certified raw and weighted gaps. Skills marked as `SELF_REPORTED` are marked as `UNVERIFIED_SELF_REPORTED` and do not compute certified gaps until diagnostic assessment or manager verification occurs.
- **Unassessed Skills**: Missing skill requirements are explicitly categorized as `UNASSESSED` (never silently assumed to be 0).
- **Criticality Categorization**:
  - `MANDATORY`: `importance_weight >= 3.0`
  - `CORE`: `importance_weight >= 2.0`
  - `ELECTIVE`: `importance_weight < 2.0`

### 2. Algorithmic Dynamic Mentor Recommendation

Candidates are discovered dynamically from active employee database records.

**Eligibility Criteria**:
1. Active employee status (`status == ACTIVE`)
2. Explicit mentorship opt-in (`mentor_opt_in == true`)
3. Available weekly mentoring hours (`mentor_availability_hrs_per_week > 0`)
4. Mentee capacity remaining (`current_mentee_count < max_mentees`)
5. Non-self mentoring (`candidate.user.id != mentee.user.id`)
6. Verified proficiency in at least one skill where the mentee has an identified gap or unassessed requirement.

**Scoring Algorithm**:
$$\text{Score} = (0.50 \times \text{SkillAffinity}) + (0.20 \times \text{AvailabilityScore}) + (0.15 \times \text{CapacityScore}) + (0.15 \times \text{DepartmentAffinity})$$

- $\text{SkillAffinity}$: Weighted proficiency gain normalized against total gap magnitude.
- $\text{AvailabilityScore}$: Normalized available hours ($\min(\text{hrs} / 10.0, 1.0)$).
- $\text{CapacityScore}$: Remaining slots normalized against mentor max capacity ($\frac{\text{max} - \text{current}}{\text{max}}$).
- $\text{DepartmentAffinity}$: $1.0$ for intra-department alignment; $0.5$ for cross-department pairing.

**Deterministic Tie-Breaking**:
1. `overallScore` DESC
2. `availableHoursPerWeek` DESC
3. `remainingCapacity` DESC
4. `mentorProfileId` ASC

### 3. Manager Approval Workflow & Concurrency Control

- **Department-Scoped Authorization**: A `MANAGER` can only approve or reject mentor recommendations for mentees within their authorized department (`mentee.user.department.id == principal.departmentId`). `ADMIN` retains global approval privileges.
- **Pessimistic Locking & Overbooking Prevention**: When approving an assignment, the mentor's profile is locked using `SELECT ... FOR UPDATE` (`@Lock(LockModeType.PESSIMISTIC_WRITE)`). Mentor capacity is revalidated inside the transaction. If capacity is exhausted, the request is rejected with HTTP `409 Conflict` (`MentorCapacityExceededException`), preventing concurrent race-condition overbooking.

### 4. Machine Learning Microservice Integration

Spring Boot integrates with the FastAPI service (`http://localhost:8000/api/v1/predict/outcome`) using Spring 6 `RestClient`:
- **Authentic Feature Sourcing**: Features are derived strictly from database records (`baseline_proficiency_avg`, `initial_gap_magnitude`, `historical_completion_rate`, `diagnostic_assessment_score`, `weekly_engagement_hours`, `course_difficulty_level`, `mentor_assigned_flag`, `tenure_months`).
- **No Invented Data**: If prerequisite records (e.g. diagnostic score) are missing, the system returns HTTP `400 Bad Request` with `IncompleteDataException` rather than fabricating numbers.
- **Resiliency**: Timeouts and connection failures return HTTP `503 Service Unavailable` (`MlServiceUnavailableException`).
- **Provenance & Persistence**: Valid predictions are persisted to `training_predictions` alongside the JSONB feature snapshot, and responses explicitly declare the `SYNTHETIC_DEVELOPMENT_DATASET` provenance.

### REST APIs Implemented (Phase 5)

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/skills/gaps/me` | Authenticated | Current employee's verified skill gap report against target role |
| `GET` | `/api/v1/skills/gaps/employee/{id}` | Manager / Admin | Employee skill gap report enforcing department boundaries |
| `GET` | `/api/v1/mentorship/recommendations/me` | Authenticated | Dynamic algorithmic mentor recommendations for current employee |
| `GET` | `/api/v1/mentorship/recommendations/{id}` | Manager / Admin | Dynamic mentor recommendations for employee by profile ID |
| `POST`| `/api/v1/mentorship/assignments/recommend` | Authenticated | Creates a recommendation or request with duplicate checks |
| `PUT` | `/api/v1/mentorship/assignments/{id}/approve` | Manager / Admin | Approves assignment with pessimistic locking & capacity check |
| `PUT` | `/api/v1/mentorship/assignments/{id}/reject` | Manager / Admin | Rejects recommendation with mandatory audit reason |
| `GET` | `/api/v1/mentorship/assignments` | Authenticated | Paged listing with role-based scoping (Self / Dept / All) |
| `POST`| `/api/v1/ml/predict/training-outcome` | Authenticated | Generates outcome prediction with live ML service integration |

### Automated Test Verification (Complete Suite)

All 51 automated backend tests pass cleanly:

```bash
cd backend
.\mvnw.cmd test
```

| Test Class | Tests | Scenarios Verified |
|---|---|---|
| `SkillGapEngineTest` | 6 | Gap arithmetic, weighting, mandatory/core classification, verified vs self-reported, unassessed handling, department RBAC |
| `MentorMatchingServiceTest` | 5 | Eligibility filtering, self-mentoring prevention, full capacity exclusion, dynamic discovery of newly added mentors, endpoint |
| `MentorAssignmentApprovalTest` | 5 | Approval workflow, reject workflow, department tenancy checks, duplicate prevention, concurrent overbooking prevention |
| `MlPredictionIntegrationTest` | 4 | Live FastAPI prediction, missing diagnostic score rejection without inventing data, 400 bad request, 503 service unavailable |
| `AuthIntegrationTest` | 6 | Successful login for 3 roles, bad credentials (401), invalid email (401), validation (400) |
| `SecurityAuthorizationTest` | 10 | Unauthenticated 401s, cross-role 403s, manager department boundaries, employee ownership |
| `EmployeeProfileSecurityTest` | 5 | Talent profile self-service, hours validation, cross-employee 403 |
| `JwtTokenProviderTest` | 4 | Token signing, claims extraction, malformed rejection, expiration rejection |
| `JpaEntityMappingTest` | 4 | Entity-table bindings, lazy relationships, mentor eligibility |
| `PasswordHashTest` | 1 | BCrypt hashing compatibility |
| `DatabaseMigrationTest` | 1 | Flyway schema & seed migration verification |
| **Total** | **51 / 51** | **BUILD SUCCESS (0 Failures, 0 Errors)** |



