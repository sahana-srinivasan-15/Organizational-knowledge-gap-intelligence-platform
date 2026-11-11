-- ==============================================================================
-- Flyway Migration: V18__mentor_course_certifications_seed.sql
-- Description: Seed verified certificates and passed quizzes for mentors to
--              enforce that mentors are ONLY qualified for courses where they
--              have uploaded an authentic certificate AND passed the diagnostic quiz.
-- ==============================================================================

-- 1. Ensure Alex Morgan (Profile 4, User 6 - MENTOR) is certified in Course 2 (Distributed Systems Architecture)
INSERT INTO course_certificates (
    employee_profile_id, course_title, course_provider, course_slug,
    certificate_file_name, credential_url, completion_date, status,
    authenticity_score, quiz_passed, verified_at, created_at
)
SELECT 4, 'Distributed Systems Architecture & Design Patterns', 'Coursera', 'distributed-systems-architecture',
       'alex_morgan_distributed_systems_cert.pdf', 'https://www.coursera.org/verify/ALEXM-DISTRIB-SYS-982',
       CURRENT_DATE - INTERVAL '60 days', 'CERTIFIED', 0.98, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM course_certificates WHERE employee_profile_id = 4 AND course_title ILIKE '%Distributed Systems%'
);

-- Seed assessment submission for Alex Morgan (Profile 4) on Course 2
INSERT INTO assessment_submissions (
    employee_profile_id, assessment_id, course_id, attempt_number,
    score, passed, answers_json, attempted_at
)
SELECT 4, a.id, 2, 1, 100.00, TRUE, '[]'::jsonb, CURRENT_TIMESTAMP - INTERVAL '50 days'
FROM assessments a
WHERE a.course_id = 2
LIMIT 1
ON CONFLICT DO NOTHING;

-- 2. Ensure Priya Sharma (Profile 5, User 7 - MENTOR) is certified in Course 3 (Production Machine Learning)
INSERT INTO course_certificates (
    employee_profile_id, course_title, course_provider, course_slug,
    certificate_file_name, credential_url, completion_date, status,
    authenticity_score, quiz_passed, verified_at, created_at
)
SELECT 5, 'Production Machine Learning with Scikit-Learn & FastAPI', 'Coursera', 'production-machine-learning-fastapi',
       'priya_sharma_mlops_cert.pdf', 'https://www.coursera.org/verify/PRIYA-MLOPS-PROD-441',
       CURRENT_DATE - INTERVAL '45 days', 'CERTIFIED', 0.96, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM course_certificates WHERE employee_profile_id = 5 AND course_title ILIKE '%Production Machine Learning%'
);

-- Seed assessment submission for Priya Sharma (Profile 5) on Course 3
INSERT INTO assessment_submissions (
    employee_profile_id, assessment_id, course_id, attempt_number,
    score, passed, answers_json, attempted_at
)
SELECT 5, a.id, 3, 1, 100.00, TRUE, '[]'::jsonb, CURRENT_TIMESTAMP - INTERVAL '40 days'
FROM assessments a
WHERE a.course_id = 3
LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Ensure Liam Chen (Profile 6, User 8 - MENTOR) is certified in Course 4 (PostgreSQL Database Performance)
INSERT INTO course_certificates (
    employee_profile_id, course_title, course_provider, course_slug,
    certificate_file_name, credential_url, completion_date, status,
    authenticity_score, quiz_passed, verified_at, created_at
)
SELECT 6, 'PostgreSQL Database Performance Tuning & Indexing', 'Coursera', 'postgresql-performance-tuning-indexing',
       'liam_chen_postgres_dba_cert.pdf', 'https://www.coursera.org/verify/LIAM-PG-PERF-882',
       CURRENT_DATE - INTERVAL '90 days', 'CERTIFIED', 0.99, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM course_certificates WHERE employee_profile_id = 6 AND course_title ILIKE '%PostgreSQL Database Performance%'
);

-- Seed assessment submission for Liam Chen (Profile 6) on Course 4
INSERT INTO assessment_submissions (
    employee_profile_id, assessment_id, course_id, attempt_number,
    score, passed, answers_json, attempted_at
)
SELECT 6, a.id, 4, 1, 100.00, TRUE, '[]'::jsonb, CURRENT_TIMESTAMP - INTERVAL '80 days'
FROM assessments a
WHERE a.course_id = 4
LIMIT 1
ON CONFLICT DO NOTHING;
