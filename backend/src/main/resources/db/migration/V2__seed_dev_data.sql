-- ==============================================================================
-- Flyway Migration: V2__seed_dev_data.sql
-- Description: Isolated development seed data for demo and integration testing
-- Note: All sample user passwords are encrypted with BCrypt (Password@123)
-- ==============================================================================

-- 1. Seed Departments
INSERT INTO departments (id, name, code, description) VALUES
(1, 'Engineering', 'ENG', 'Core software development, architecture, and technical infrastructure'),
(2, 'Data & Artificial Intelligence', 'DAI', 'Machine learning engineering, data science, and analytics intelligence'),
(3, 'Product & Design', 'PRD', 'Product management, user experience design, and digital delivery');

-- 2. Seed Job Roles
INSERT INTO job_roles (id, title, code, department_id, level, description) VALUES
(1, 'Senior Software Engineer', 'ROLE_SR_SWE', 1, 'SENIOR', 'Architects scalable distributed backend services and leads technical initiatives'),
(2, 'Junior Software Engineer', 'ROLE_JR_SWE', 1, 'JUNIOR', 'Develops application features, writes unit tests, and contributes to codebase'),
(3, 'Machine Learning Engineer', 'ROLE_ML_ENG', 2, 'MID', 'Develops, validates, and deploys predictive ML pipelines and services'),
(4, 'Technical Product Manager', 'ROLE_PRD_MGR', 3, 'MID', 'Defines technical product roadmaps, requirements, and cross-team alignment');

-- 3. Seed Users (Strictly 3 Authentication Roles: ADMIN, MANAGER, EMPLOYEE)
-- Password hash: $2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi (BCrypt of 'Password@123')
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, department_id) VALUES
(1, 'admin@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'System', 'Admin', 'ADMIN', 'ACTIVE', 1),
(2, 'manager.eng@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Sarah', 'Jenkins', 'MANAGER', 'ACTIVE', 1),
(3, 'alex.senior@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Alex', 'Morgan', 'EMPLOYEE', 'ACTIVE', 1),
(4, 'david.junior@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'David', 'Kim', 'EMPLOYEE', 'ACTIVE', 1),
(5, 'elena.ai@orgkgi.dev', '$2a$10$AqkN3JMh5LA3/2ie38bqc..aYkCPAOz.lZIawDC3NPf9rQhNr7FNi', 'Elena', 'Rostova', 'EMPLOYEE', 'ACTIVE', 2);

-- Assign Engineering Manager
UPDATE departments SET manager_id = 2 WHERE id = 1;

-- 4. Seed Employee Profiles (Mentorship is dynamic: opt-in, availability, capacity)
INSERT INTO employee_profiles (id, user_id, current_job_role_id, target_job_role_id, manager_id, hire_date, mentor_opt_in, mentor_availability_hrs_per_week, current_mentee_count, max_mentees) VALUES
(1, 3, 1, 1, 2, '2023-01-15', TRUE, 5, 0, 3),
(2, 4, 2, 1, 2, '2025-06-01', FALSE, 0, 0, 0),
(3, 5, 3, 3, 2, '2024-03-10', TRUE, 4, 0, 2);

-- 5. Seed Skill Taxonomy
INSERT INTO skill_categories (id, name, description) VALUES
(1, 'Software Engineering & Backend', 'Core programming languages, server frameworks, and architectural principles'),
(2, 'Data Science & Machine Learning', 'Data manipulation, statistical analysis, and applied machine learning models'),
(3, 'Cloud & Infrastructure', 'Containerization, orchestration, and continuous integration');

INSERT INTO skills (id, name, code, category_id, description) VALUES
(1, 'Java Programming', 'SKL_JAVA', 1, 'Core Java, collections, concurrency, and JVM internals'),
(2, 'Spring Boot Framework', 'SKL_SPRING', 1, 'Spring Boot, Spring Data JPA, Spring Security, and REST APIs'),
(3, 'System Design & Architecture', 'SKL_SYS_DESIGN', 1, 'Distributed systems, microservices patterns, caching, and scalability'),
(4, 'PostgreSQL & Database Optimization', 'SKL_PGSQL', 1, 'Relational schema design, indexing strategies, and query performance tuning'),
(5, 'Python for Data Science', 'SKL_PYTHON', 2, 'Python programming, NumPy, Pandas, and data wrangling'),
(6, 'Machine Learning & Scikit-Learn', 'SKL_ML_SKL', 2, 'Supervised/unsupervised learning, feature engineering, and model evaluation'),
(7, 'Docker & Containerization', 'SKL_DOCKER', 3, 'Container packaging, multi-stage Docker builds, and deployment');

-- 6. Seed Job Role Skill Requirements
-- Senior Software Engineer Requirements (Target Role for David Kim)
INSERT INTO job_role_skills (job_role_id, skill_id, required_proficiency_level, importance_weight) VALUES
(1, 1, 4, 3.0), -- Java (Mandatory, level 4)
(1, 2, 4, 3.0), -- Spring Boot (Mandatory, level 4)
(1, 3, 4, 2.0), -- System Design (Core, level 4)
(1, 4, 3, 2.0), -- PostgreSQL (Core, level 3)
(1, 7, 3, 1.0); -- Docker (Elective, level 3)

-- Junior Software Engineer Requirements
INSERT INTO job_role_skills (job_role_id, skill_id, required_proficiency_level, importance_weight) VALUES
(2, 1, 2, 3.0),
(2, 2, 2, 2.0),
(2, 4, 2, 2.0);

-- Machine Learning Engineer Requirements
INSERT INTO job_role_skills (job_role_id, skill_id, required_proficiency_level, importance_weight) VALUES
(3, 5, 4, 3.0),
(3, 6, 4, 3.0),
(3, 4, 3, 2.0),
(3, 7, 3, 2.0);

-- 7. Seed Employee Skills (Creates measurable skill gap for David Kim vs Senior Role)
-- Alex Morgan (Senior SWE): Highly proficient mentor candidate
INSERT INTO employee_skills (employee_profile_id, skill_id, current_proficiency_level, verified_proficiency_level, verification_status, last_assessed_at) VALUES
(1, 1, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(1, 2, 5, 4, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(1, 3, 4, 4, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(1, 4, 4, 4, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '60 days'),
(1, 7, 3, 3, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '90 days');

-- David Kim (Junior SWE): Has genuine skill gaps targeting Senior SWE (Skills 2 & 3 have gap >= 2)
INSERT INTO employee_skills (employee_profile_id, skill_id, current_proficiency_level, verified_proficiency_level, verification_status, last_assessed_at) VALUES
(2, 1, 3, 2, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(2, 2, 2, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 4, 2, 2, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(2, 3, 1, 1, 'SELF_REPORTED', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Elena Rostova (ML Engineer)
INSERT INTO employee_skills (employee_profile_id, skill_id, current_proficiency_level, verified_proficiency_level, verification_status, last_assessed_at) VALUES
(3, 5, 5, 5, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '25 days'),
(3, 6, 4, 4, 'MANAGER_VERIFIED', CURRENT_TIMESTAMP - INTERVAL '25 days'),
(3, 4, 3, 3, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '40 days'),
(3, 7, 3, 3, 'ASSESSED', CURRENT_TIMESTAMP - INTERVAL '50 days');

-- 8. Seed Diagnostic Assessments & Questions
INSERT INTO assessments (id, title, skill_id, passing_score, time_limit_minutes, description) VALUES
(1, 'Spring Boot Architecture Diagnostic', 2, 75.0, 20, 'Evaluates production knowledge of Spring Boot autoconfiguration, JPA repositories, and security filters'),
(2, 'Java Concurrency & Data Structures', 1, 70.0, 25, 'Evaluates multi-threading, synchronization, memory model, and collections hierarchy');

INSERT INTO assessment_questions (assessment_id, question_text, options_json, correct_option_index, difficulty_level) VALUES
(1, 'Which annotation in Spring Boot allows dynamic injection of configuration properties with type safety?', '["@Value", "@ConfigurationProperties", "@PropertySource", "@Autowired"]'::jsonb, 1, 2),
(1, 'What is the default propagation behavior for Spring declarative transactions (@Transactional)?', '["PROPAGATION_REQUIRES_NEW", "PROPAGATION_REQUIRED", "PROPAGATION_SUPPORTS", "PROPAGATION_NESTED"]'::jsonb, 1, 3),
(1, 'How does Spring Security filter chain handle stateless authentication?', '["By storing session in Redis", "Via SecurityContextRepository with NullRequestCache and JWT filter", "By disabling HTTPS", "By creating cookies on each request"]'::jsonb, 1, 3),
(2, 'Which collection class in Java provides concurrent, non-blocking reads without locking the whole table?', '["Hashtable", "synchronizedMap", "ConcurrentHashMap", "Collections.unmodifiableMap"]'::jsonb, 2, 2),
(2, 'What happens if an unhandled exception occurs inside a thread executed by ExecutorService.submit()?', '["The JVM crashes", "The exception is caught and rethrown when calling Future.get()", "The exception is silently discarded", "The thread pool terminates"]'::jsonb, 1, 3);

-- 9. Seed Courses & Course-Skill Relationships
INSERT INTO courses (id, title, provider, duration_hours, difficulty_level, rating, course_url, description) VALUES
(1, 'Advanced Spring Boot Microservices in Production', 'Internal Academy', 28, 'ADVANCED', 4.85, 'https://academy.orgkgi.dev/courses/spring-boot-adv', 'Deep dive into microservices resiliency, distributed tracing, and Spring Security 6 stateless JWT architecture'),
(2, 'Distributed Systems Architecture & Design Patterns', 'Coursera Enterprise', 24, 'ADVANCED', 4.90, 'https://academy.orgkgi.dev/courses/system-design', 'Learn event-driven architecture, CQRS, caching strategies, and database sharding techniques'),
(3, 'Production Machine Learning with Scikit-Learn & FastAPI', 'Internal Academy', 35, 'INTERMEDIATE', 4.80, 'https://academy.orgkgi.dev/courses/ml-prod', 'End-to-end ML workflows from data validation to model serving and latency monitoring'),
(4, 'PostgreSQL Database Performance Tuning & Indexing', 'Internal Academy', 16, 'INTERMEDIATE', 4.65, 'https://academy.orgkgi.dev/courses/postgres-tuning', 'Query planning analysis, B-tree indexes, execution plans, and connection pool tuning');

INSERT INTO course_skills (course_id, skill_id, target_proficiency_gain) VALUES
(1, 2, 2), -- Spring Boot gain +2
(1, 7, 1), -- Docker gain +1
(2, 3, 2), -- System Design gain +2
(3, 5, 1), -- Python gain +1
(3, 6, 2), -- ML gain +2
(4, 4, 1); -- PostgreSQL gain +1

-- 10. Seed Learning Path for David Kim (Targeting Senior SWE)
INSERT INTO learning_paths (id, employee_profile_id, target_job_role_id, title, status) VALUES
(1, 2, 1, 'Senior Software Engineer Upskilling Roadmap', 'ACTIVE');

INSERT INTO learning_path_courses (learning_path_id, course_id, step_order, status, progress_percentage) VALUES
(1, 1, 1, 'IN_PROGRESS', 40),
(1, 2, 2, 'NOT_STARTED', 0);

-- 11. Seed Dynamic Mentor Recommendation (Pending Manager Approval)
-- Matches David Kim (Mentee) with Alex Morgan (Mentor) on Spring Boot (Skill 2)
INSERT INTO mentor_assignments (id, mentee_id, mentor_id, skill_id, status, manager_id, notes) VALUES
(1, 2, 1, 2, 'RECOMMENDED', 2, 'Algorithmic dynamic recommendation: 92% affinity score based on verified proficiency delta (+3) and mentor workload capacity (0/3 active mentees).');

-- 12. Seed In-App Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(2, 'Mentor Recommendation Pending Approval', 'Employee David Kim has been matched with mentor Alex Morgan for Spring Boot Framework. Please review and approve.', 'MENTOR_RECOMMENDED', FALSE),
(4, 'Learning Path Progress Milestone', 'You have completed 40% of Advanced Spring Boot Microservices in Production.', 'COURSE_PROGRESS', TRUE);

-- 13. Seed Audit Logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json, ip_address) VALUES
(1, 'DATABASE_SEED', 'SYSTEM', '1', '{"status": "INITIAL_SEED_COMPLETE", "schema_version": "V2"}'::jsonb, '127.0.0.1'),
(2, 'GENERATE_RECOMMENDATION', 'MENTOR_ASSIGNMENT', '1', '{"mentee_id": 2, "mentor_id": 1, "skill_id": 2, "affinity_score": 0.92}'::jsonb, '127.0.0.1');

-- Reset sequences to prevent key collision on subsequent insertions
SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));
SELECT setval('job_roles_id_seq', (SELECT MAX(id) FROM job_roles));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('employee_profiles_id_seq', (SELECT MAX(id) FROM employee_profiles));
SELECT setval('skill_categories_id_seq', (SELECT MAX(id) FROM skill_categories));
SELECT setval('skills_id_seq', (SELECT MAX(id) FROM skills));
SELECT setval('job_role_skills_id_seq', (SELECT MAX(id) FROM job_role_skills));
SELECT setval('employee_skills_id_seq', (SELECT MAX(id) FROM employee_skills));
SELECT setval('assessments_id_seq', (SELECT MAX(id) FROM assessments));
SELECT setval('assessment_questions_id_seq', (SELECT MAX(id) FROM assessment_questions));
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
SELECT setval('course_skills_id_seq', (SELECT MAX(id) FROM course_skills));
SELECT setval('learning_paths_id_seq', (SELECT MAX(id) FROM learning_paths));
SELECT setval('learning_path_courses_id_seq', (SELECT MAX(id) FROM learning_path_courses));
SELECT setval('mentor_assignments_id_seq', (SELECT MAX(id) FROM mentor_assignments));
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));
