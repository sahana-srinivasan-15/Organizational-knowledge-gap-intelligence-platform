-- ==============================================================================
-- Flyway Migration: V23__reset_david_kim_and_add_gap_report_dispatch.sql
-- Description: Extends notification types for Manager Gap Reports,
--              resets David Kim's profile state to clean baseline for
--              resume-driven assessment and fresh gap analysis.
-- ==============================================================================

-- 1. Extend notifications check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
        'ASSESSMENT_DUE',
        'MENTOR_RECOMMENDED',
        'MENTOR_APPROVED',
        'MENTOR_ASSIGNED',
        'COURSE_PROGRESS',
        'RISK_ALERT',
        'GENERAL',
        'LIVE_CLASS_SUGGESTION',
        'MATERIAL_SUGGESTION',
        'MENTOR_MESSAGE',
        'COURSE_RECOMMENDATION',
        'GAP_REPORT_SUBMITTED',
        'ASSESSMENT_COMPLETED',
        'TEST_SCORE_REPORT'
    )
);

-- 2. Clear old assessment submissions and attempts for David Kim (Profile 2)
DELETE FROM assessment_submissions WHERE employee_profile_id = 2;
DELETE FROM assessment_attempts WHERE employee_profile_id = 2;
DELETE FROM course_certificates WHERE employee_profile_id = 2;

-- 3. Reset David Kim's resume metadata on employee profile
UPDATE employee_profiles 
SET resume_file_name = 'David_Kim_Resume.pdf',
    resume_file_size = 34500,
    resume_content_type = 'application/pdf',
    resume_uploaded_at = CURRENT_TIMESTAMP
WHERE id = 2;

-- 4. Reset David Kim's skills to fresh unassessed baseline extracted from resume
DELETE FROM employee_skills WHERE employee_profile_id = 2;

INSERT INTO employee_skills (
    employee_profile_id, 
    skill_id, 
    current_proficiency_level, 
    verified_proficiency_level, 
    verification_status, 
    last_assessed_at
) VALUES
(2, 1, 1, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '1 day'), -- Java Programming
(2, 2, 1, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '1 day'), -- Spring Boot Framework
(2, 4, 1, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '1 day'), -- PostgreSQL & Database Optimization
(2, 3, 1, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '1 day'), -- System Design & Architecture
(2, 7, 1, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '1 day'); -- Docker & Containerization

SELECT setval('employee_skills_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employee_skills));

