-- ==============================================================================
-- Flyway Migration: V3__add_mentor_role.sql
-- Description: Expand users table role constraint to support MENTOR and seed mentor account
-- ==============================================================================

-- 1. Update Role Check Constraint on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE', 'MENTOR'));

-- 2. Seed Dedicated Mentor Account
-- Email: mentor.alex@orgkgi.dev | Password: Password@123 (hash matches seed users)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, department_id) VALUES
(6, 'mentor.alex@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Alex', 'Morgan', 'MENTOR', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Employee Profile for Mentor (id 4)
INSERT INTO employee_profiles (id, user_id, current_job_role_id, target_job_role_id, manager_id, hire_date, mentor_opt_in, mentor_availability_hrs_per_week, current_mentee_count, max_mentees) VALUES
(4, 6, 1, 1, 2, '2023-01-15', TRUE, 8, 1, 4)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Verified Skills for Mentor Profile
INSERT INTO employee_skills (employee_profile_id, skill_id, current_proficiency_level, verified_proficiency_level, verification_status, last_assessed_at) VALUES
(4, 1, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(4, 2, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(4, 3, 4, 4, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(4, 4, 4, 4, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '60 days'),
(4, 7, 4, 4, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '90 days')
ON CONFLICT DO NOTHING;

-- 5. Seed Active Mentor Assignment linking Mentor (Profile 4) with Mentee David Kim (Profile 2)
INSERT INTO mentor_assignments (id, mentee_id, mentor_id, skill_id, status, manager_id, notes, assigned_at) VALUES
(2, 2, 4, 2, 'ACTIVE', 2, 'Active mentorship in Spring Boot Framework & Distributed Systems Architecture.', CURRENT_TIMESTAMP - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Synchronize Sequence Values
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('employee_profiles_id_seq', (SELECT MAX(id) FROM employee_profiles));
SELECT setval('mentor_assignments_id_seq', (SELECT MAX(id) FROM mentor_assignments));
SELECT setval('employee_skills_id_seq', (SELECT MAX(id) FROM employee_skills));
