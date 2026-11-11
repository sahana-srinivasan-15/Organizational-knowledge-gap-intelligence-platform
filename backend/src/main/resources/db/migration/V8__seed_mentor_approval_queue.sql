-- ==============================================================================
-- Flyway Migration: V8__seed_mentor_approval_queue.sql
-- Description: Seed additional mentors, mentees, and pending mentor recommendations
--              in manager approval queue.
-- ==============================================================================

-- 1. Ensure Department 1 Manager is Sarah Jenkins (User 2)
UPDATE departments SET manager_id = 2 WHERE id = 1;

-- 2. Seed Additional Users for Mentorship Ecosystem
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, department_id) VALUES
(7, 'priya.sharma@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Priya', 'Sharma', 'MENTOR', 'ACTIVE', 1),
(8, 'liam.chen@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Liam', 'Chen', 'MENTOR', 'ACTIVE', 1),
(9, 'maya.patel@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Maya', 'Patel', 'EMPLOYEE', 'ACTIVE', 1),
(10, 'marcus.vance@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Marcus', 'Vance', 'EMPLOYEE', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Employee Profiles for Mentors and Mentees
INSERT INTO employee_profiles (id, user_id, current_job_role_id, target_job_role_id, manager_id, hire_date, mentor_opt_in, mentor_availability_hrs_per_week, current_mentee_count, max_mentees) VALUES
(5, 7, 1, 1, 2, '2022-04-10', TRUE, 8, 0, 5),
(6, 8, 1, 1, 2, '2023-08-15', TRUE, 6, 0, 4),
(7, 9, 2, 1, 2, '2025-01-20', FALSE, 0, 0, 0),
(8, 10, 2, 1, 2, '2025-03-12', FALSE, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Verified Skills for Mentors
INSERT INTO employee_skills (employee_profile_id, skill_id, current_proficiency_level, verified_proficiency_level, verification_status, last_assessed_at) VALUES
(5, 2, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(5, 3, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(6, 4, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(6, 7, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(7, 1, 2, 2, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, 3, 1, 1, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(8, 4, 1, 1, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(8, 7, 2, 2, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- 5. Seed Diverse Pending Mentor Recommendations (Status: RECOMMENDED)
INSERT INTO mentor_assignments (id, mentee_id, mentor_id, skill_id, status, manager_id, notes, created_at) VALUES
(1, 2, 4, 2, 'RECOMMENDED', 2, 'AI Algorithmic Match: 95% affinity score. Mentee David Kim needs Spring Boot mastery for Senior SWE target role; paired with Mentor Alex Morgan.', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(3, 7, 5, 3, 'RECOMMENDED', 2, 'AI Algorithmic Match: 96% affinity score. Mentee Maya Patel has +3 level gap in System Design & Architecture; paired with Principal Architect Priya Sharma.', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
(4, 7, 4, 1, 'RECOMMENDED', 2, 'AI Algorithmic Match: 91% affinity score. Java Concurrency & JVM Tuning mentoring to accelerate roadmap completion.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(5, 8, 6, 7, 'RECOMMENDED', 2, 'AI Algorithmic Match: 94% affinity score. Mentee Marcus Vance needs Docker & Containerization orchestration skills for production deployment readiness.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(6, 8, 6, 4, 'RECOMMENDED', 2, 'AI Algorithmic Match: 88% affinity score. PostgreSQL Query Optimization & Database Indexing mentoring with Liam Chen.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(7, 2, 5, 2, 'RECOMMENDED', 2, 'AI Algorithmic Match: 93% affinity score. Microservices architecture review and mentoring with Priya Sharma.', CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET status = 'RECOMMENDED', notes = EXCLUDED.notes;

-- 6. Synchronize Sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('employee_profiles_id_seq', (SELECT MAX(id) FROM employee_profiles));
SELECT setval('employee_skills_id_seq', (SELECT MAX(id) FROM employee_skills));
SELECT setval('mentor_assignments_id_seq', (SELECT MAX(id) FROM mentor_assignments));

