-- ==============================================================================
-- Flyway Migration: V1__init_schema.sql
-- Description: Core relational schema for Organizational Knowledge Gap Intelligence Platform
-- ==============================================================================

-- 1. Departments Table
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Job Roles Table
CREATE TABLE job_roles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    level VARCHAR(30) NOT NULL DEFAULT 'MID',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_job_roles_department ON job_roles(department_id);

-- 3. Users Table (Strictly 3 Authentication Roles: ADMIN, MANAGER, EMPLOYEE)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);

-- Department Head / Manager association
ALTER TABLE departments ADD COLUMN manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_departments_manager ON departments(manager_id);

-- 4. Employee Profiles (Mentorship is dynamic employee capability, not a login role)
CREATE TABLE employee_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_job_role_id BIGINT REFERENCES job_roles(id) ON DELETE SET NULL,
    target_job_role_id BIGINT REFERENCES job_roles(id) ON DELETE SET NULL,
    manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    hire_date DATE,
    mentor_opt_in BOOLEAN DEFAULT FALSE NOT NULL,
    mentor_availability_hrs_per_week INT DEFAULT 0 NOT NULL CHECK (mentor_availability_hrs_per_week >= 0),
    current_mentee_count INT DEFAULT 0 NOT NULL CHECK (current_mentee_count >= 0),
    max_mentees INT DEFAULT 3 NOT NULL CHECK (max_mentees >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_emp_profiles_user ON employee_profiles(user_id);
CREATE INDEX idx_emp_profiles_manager ON employee_profiles(manager_id);
CREATE INDEX idx_emp_profiles_current_role ON employee_profiles(current_job_role_id);
CREATE INDEX idx_emp_profiles_target_role ON employee_profiles(target_job_role_id);
CREATE INDEX idx_emp_profiles_mentor_opt_in ON employee_profiles(mentor_opt_in);

-- 5. Skill Taxonomy: Categories and Skills
CREATE TABLE skill_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL REFERENCES skill_categories(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_skills_category ON skills(category_id);

-- 6. Job Role Skill Requirements
CREATE TABLE job_role_skills (
    id BIGSERIAL PRIMARY KEY,
    job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_proficiency_level INT NOT NULL CHECK (required_proficiency_level BETWEEN 1 AND 5),
    importance_weight DECIMAL(3, 1) NOT NULL DEFAULT 1.0 CHECK (importance_weight > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_role_skill UNIQUE (job_role_id, skill_id)
);

CREATE INDEX idx_role_skills_role ON job_role_skills(job_role_id);
CREATE INDEX idx_role_skills_skill ON job_role_skills(skill_id);

-- 7. Employee Skills (Current and Verified Proficiencies)
CREATE TABLE employee_skills (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    current_proficiency_level INT NOT NULL CHECK (current_proficiency_level BETWEEN 1 AND 5),
    verified_proficiency_level INT NOT NULL DEFAULT 1 CHECK (verified_proficiency_level BETWEEN 1 AND 5),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'SELF_REPORTED' CHECK (verification_status IN ('SELF_REPORTED', 'ASSESSED', 'MANAGER_VERIFIED')),
    last_assessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_employee_skill UNIQUE (employee_profile_id, skill_id)
);

CREATE INDEX idx_emp_skills_profile ON employee_skills(employee_profile_id);
CREATE INDEX idx_emp_skills_skill ON employee_skills(skill_id);
CREATE INDEX idx_emp_skills_status ON employee_skills(verification_status);

-- 8. Skill Assessments
CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    passing_score DECIMAL(5, 2) NOT NULL DEFAULT 70.0 CHECK (passing_score BETWEEN 0.0 AND 100.0),
    time_limit_minutes INT NOT NULL DEFAULT 30 CHECK (time_limit_minutes > 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_assessments_skill ON assessments(skill_id);

CREATE TABLE assessment_questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options_json JSONB NOT NULL,
    correct_option_index INT NOT NULL CHECK (correct_option_index >= 0),
    difficulty_level INT NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_questions_assessment ON assessment_questions(assessment_id);

CREATE TABLE assessment_submissions (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    score DECIMAL(5, 2) NOT NULL CHECK (score BETWEEN 0.0 AND 100.0),
    passed BOOLEAN NOT NULL,
    answers_json JSONB,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_submissions_profile ON assessment_submissions(employee_profile_id);
CREATE INDEX idx_submissions_assessment ON assessment_submissions(assessment_id);

-- 9. Dynamic Mentor Recommendations & Assignments (Manager Approved)
CREATE TABLE mentor_assignments (
    id BIGSERIAL PRIMARY KEY,
    mentee_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    mentor_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'RECOMMENDED' CHECK (status IN ('RECOMMENDED', 'REQUESTED', 'APPROVED_BY_MANAGER', 'ACTIVE', 'COMPLETED', 'REJECTED')),
    manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_mentee_not_mentor CHECK (mentee_id <> mentor_id)
);

CREATE INDEX idx_mentor_assign_mentee ON mentor_assignments(mentee_id);
CREATE INDEX idx_mentor_assign_mentor ON mentor_assignments(mentor_id);
CREATE INDEX idx_mentor_assign_skill ON mentor_assignments(skill_id);
CREATE INDEX idx_mentor_assign_status ON mentor_assignments(status);
CREATE INDEX idx_mentor_assign_manager ON mentor_assignments(manager_id);

-- 10. Courses & Course-Skill Mappings
CREATE TABLE courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    duration_hours INT NOT NULL CHECK (duration_hours > 0),
    difficulty_level VARCHAR(20) NOT NULL DEFAULT 'BEGINNER' CHECK (difficulty_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    rating DECIMAL(3, 2) DEFAULT 4.5 CHECK (rating BETWEEN 0.0 AND 5.0),
    course_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE course_skills (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    target_proficiency_gain INT NOT NULL DEFAULT 1 CHECK (target_proficiency_gain BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_course_skill UNIQUE (course_id, skill_id)
);

CREATE INDEX idx_course_skills_course ON course_skills(course_id);
CREATE INDEX idx_course_skills_skill ON course_skills(skill_id);

-- 11. Learning Paths & Path Courses
CREATE TABLE learning_paths (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    target_job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_learning_paths_profile ON learning_paths(employee_profile_id);
CREATE INDEX idx_learning_paths_role ON learning_paths(target_job_role_id);
CREATE INDEX idx_learning_paths_status ON learning_paths(status);

CREATE TABLE learning_path_courses (
    id BIGSERIAL PRIMARY KEY,
    learning_path_id BIGINT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    step_order INT NOT NULL CHECK (step_order > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_learning_path_course UNIQUE (learning_path_id, course_id)
);

CREATE INDEX idx_lpc_path ON learning_path_courses(learning_path_id);
CREATE INDEX idx_lpc_course ON learning_path_courses(course_id);

-- 12. Machine Learning Training Predictions
CREATE TABLE training_predictions (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    learning_path_id BIGINT REFERENCES learning_paths(id) ON DELETE SET NULL,
    predicted_outcome VARCHAR(20) NOT NULL CHECK (predicted_outcome IN ('SUCCESS', 'AT_RISK')),
    predicted_success_probability DECIMAL(5, 4) NOT NULL CHECK (predicted_success_probability BETWEEN 0.0 AND 1.0),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    model_version VARCHAR(50) NOT NULL,
    feature_snapshot_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_predictions_profile ON training_predictions(employee_profile_id);
CREATE INDEX idx_predictions_path ON training_predictions(learning_path_id);
CREATE INDEX idx_predictions_outcome ON training_predictions(predicted_outcome);

-- 13. In-App Notifications
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ASSESSMENT_DUE', 'MENTOR_RECOMMENDED', 'MENTOR_APPROVED', 'MENTOR_ASSIGNED', 'COURSE_PROGRESS', 'RISK_ALERT', 'GENERAL')),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- 14. Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details_json JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
