-- ==============================================================================
-- Flyway Migration: V10__reset_dev_seed_state.sql
-- Description: Resets baseline employee skills and learning path for David Kim
--              to ensure clean gap analysis and valid roadmap courses.
-- ==============================================================================

-- 1. Clean certificates for David Kim (Profile 2)
DELETE FROM course_certificates WHERE employee_profile_id = 2;

-- 2. Clean extra or abandoned learning paths for David Kim
DELETE FROM learning_path_courses WHERE learning_path_id IN (
    SELECT id FROM learning_paths WHERE employee_profile_id = 2 AND id <> 1
);
DELETE FROM learning_paths WHERE employee_profile_id = 2 AND id <> 1;

-- 3. Reset Learning Path 1 for David Kim
DELETE FROM learning_path_courses WHERE learning_path_id = 1;
DELETE FROM learning_paths WHERE id = 1;

INSERT INTO learning_paths (id, employee_profile_id, target_job_role_id, title, status)
VALUES (1, 2, 1, 'Senior Software Engineer Upskilling Roadmap', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET 
    employee_profile_id = 2,
    target_job_role_id = 1,
    title = 'Senior Software Engineer Upskilling Roadmap',
    status = 'ACTIVE';

INSERT INTO learning_path_courses (learning_path_id, course_id, step_order, status, progress_percentage)
VALUES 
(1, 1, 1, 'IN_PROGRESS', 40),
(1, 2, 2, 'NOT_STARTED', 0);

SELECT setval('learning_paths_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM learning_paths), 1));
SELECT setval('learning_path_courses_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM learning_path_courses), 2));

-- 4. Reset David Kim (profile 2) skills to initial baseline:
-- Java (Skill 1): current 3, verified 2, ASSESSED
-- Spring Boot (Skill 2): current 2, verified 1, SELF_REPORTED
-- PostgreSQL (Skill 4): current 2, verified 2, ASSESSED
-- System Design (Skill 3): current 1, verified 1, SELF_REPORTED
DELETE FROM employee_skills WHERE employee_profile_id = 2;

INSERT INTO employee_skills (employee_profile_id, skill_id, current_proficiency_level, verified_proficiency_level, verification_status, last_assessed_at) VALUES
(2, 1, 3, 2, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(2, 2, 2, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 4, 2, 2, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(2, 3, 1, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '5 days');

SELECT setval('employee_skills_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employee_skills));

