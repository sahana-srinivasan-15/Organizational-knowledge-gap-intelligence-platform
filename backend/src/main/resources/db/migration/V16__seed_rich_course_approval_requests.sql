-- ==============================================================================
-- Flyway Migration: V16__seed_rich_course_approval_requests.sql
-- Description: Seed diverse, realistic course approval requests for managers
--              across multiple employees, priorities, and approval statuses.
-- ==============================================================================

-- 1. David Kim (Profile ID: 2, Manager: Sarah Jenkins ID 2)
INSERT INTO course_approval_requests (
    employee_profile_id, course_id, external_course_title, external_course_provider,
    external_course_url, price, duration_hours, difficulty_level, rating,
    target_skill_id, target_skill_name, reason, expected_outcome,
    priority, status, manager_id, created_at, updated_at
) VALUES (
    2, 12, 'Docker & Kubernetes: The Practical Guide', 'Udemy',
    'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', 34.99, 23, 'INTERMEDIATE', 4.85,
    7, 'Docker & Containerization',
    'Need to containerize microservices for upcoming sprint deployment and configure multi-stage Docker builds.',
    'Gain production competency in container lifecycle, Docker Compose networking, and local Kubernetes debugging.',
    'HIGH', 'PENDING', 2, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    2, 44, 'Google Cloud Fundamentals: Core Infrastructure', 'Coursera',
    'https://www.coursera.org/learn/gcp-fundamentals', 49.00, 10, 'BEGINNER', 4.85,
    7, 'Docker & Containerization',
    'Required to understand cloud networking, IAM policies, and cloud storage for the backend migration.',
    'Understand core GCP cloud architecture, compute engines, and secure resource provisioning.',
    'MEDIUM', 'PENDING', 2, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- 2. Maya Patel (Profile ID: 7, Manager: Sarah Jenkins ID 2)
INSERT INTO course_approval_requests (
    employee_profile_id, course_id, external_course_title, external_course_provider,
    external_course_url, price, duration_hours, difficulty_level, rating,
    target_skill_id, target_skill_name, reason, expected_outcome,
    priority, status, manager_id, manager_comment, reviewed_at, created_at, updated_at
) VALUES (
    7, 11, 'PostgreSQL Bootcamp: Beginner to Advanced DBA', 'Udemy',
    'https://www.udemy.com/course/postgresql-bootcamp/', 29.99, 26, 'ADVANCED', 4.85,
    4, 'PostgreSQL & Database Optimization',
    'Need deeper mastery in index tuning, query execution plans, and transaction isolation levels for database performance.',
    'Optimize slow database queries and configure connection pooling with PgBouncer.',
    'HIGH', 'PENDING', 2, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    7, 5, 'Java Programming Masterclass: Java 17 to Java 21', 'Udemy',
    'https://www.udemy.com/course/java-the-complete-java-developer-course/', 39.99, 80, 'INTERMEDIATE', 4.70,
    1, 'Java Programming',
    'Upskilling on modern Java 21 features, virtual threads, and advanced collections hierarchy.',
    'Write clean, concurrent, high-throughput backend services using modern Java language patterns.',
    'MEDIUM', 'APPROVED', 2, 'Great initiative. Modern Java 21 LTS adoption is a key objective for Q4.',
    CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- 3. Marcus Vance (Profile ID: 8, Manager: Sarah Jenkins ID 2)
INSERT INTO course_approval_requests (
    employee_profile_id, course_id, external_course_title, external_course_provider,
    external_course_url, price, duration_hours, difficulty_level, rating,
    target_skill_id, target_skill_name, reason, expected_outcome,
    priority, status, manager_id, manager_comment, reviewed_at, created_at, updated_at
) VALUES (
    8, 42, 'AI-Assisted Code Modernization', 'Coursera',
    'https://www.coursera.org/learn/ai-assisted-code-modernization', 49.00, 7, 'INTERMEDIATE', 4.85,
    2, 'Spring Boot Framework',
    'Refactoring legacy monolith service code into modern Spring Boot REST microservices using AI tools.',
    'Accelerate code refactoring velocity by 40% with automated unit test generation and static analysis.',
    'URGENT', 'PENDING', 2, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'
),
(
    8, 33, 'Performing Data Aggregation using SQL Aggregate Functions', 'Coursera',
    'https://www.coursera.org/learn/performing-data-aggregation-using-sql-aggregate-functions', 19.99, 2, 'BEGINNER', 4.85,
    4, 'PostgreSQL & Database Optimization',
    'Need refresher on complex group by and aggregate reporting queries.',
    'Master SQL aggregation pipelines for analytics dashboards.',
    'LOW', 'REJECTED', 2, 'This guided project is too short and basic for your senior roadmap. Consider the full PostgreSQL bootcamp instead.',
    CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- 4. Elena Rostova (Profile ID: 3, Manager: Sarah Jenkins ID 2)
INSERT INTO course_approval_requests (
    employee_profile_id, course_id, external_course_title, external_course_provider,
    external_course_url, price, duration_hours, difficulty_level, rating,
    target_skill_id, target_skill_name, reason, expected_outcome,
    priority, status, manager_id, created_at, updated_at
) VALUES (
    3, 3, 'Production Machine Learning with Scikit-Learn & FastAPI', 'Coursera',
    'https://www.coursera.org/learn/introduction-to-machine-learning-in-production', 49.00, 35, 'ADVANCED', 4.80,
    6, 'Machine Learning & Scikit-Learn',
    'Deploying production prediction models with low-latency REST endpoints and monitoring model drift.',
    'Automate CI/CD pipelines for ML models with automated re-training triggers.',
    'HIGH', 'PENDING', 2, CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours'
),
(
    3, 14, 'Python for Everybody Specialization', 'Coursera',
    'https://www.coursera.org/specializations/python', 49.00, 40, 'BEGINNER', 4.85,
    5, 'Python for Data Science',
    'Foundational Python programming review.',
    'Revisiting core language mechanics.',
    'LOW', 'WITHDRAWN', 2, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '3 days'
);

-- 5. Alex Morgan (Profile ID: 1, Manager: Sarah Jenkins ID 2)
INSERT INTO course_approval_requests (
    employee_profile_id, course_id, external_course_title, external_course_provider,
    external_course_url, price, duration_hours, difficulty_level, rating,
    target_skill_id, target_skill_name, reason, expected_outcome,
    priority, status, manager_id, created_at, updated_at
) VALUES (
    1, 9, 'Full Stack Web Development with React and Spring Boot', 'Coursera',
    'https://www.coursera.org/learn/advanced-react', 49.00, 36, 'INTERMEDIATE', 4.75,
    2, 'Spring Boot Framework',
    'Leading architecture alignment between React frontend state management and Spring Boot backend microservices.',
    'Establish engineering best practices and type-safe API contract standards across frontend & backend.',
    'HIGH', 'PENDING', 2, CURRENT_TIMESTAMP - INTERVAL '12 hours', CURRENT_TIMESTAMP - INTERVAL '12 hours'
);

-- Reset sequence to prevent collision
SELECT setval('course_approval_requests_id_seq', (SELECT MAX(id) FROM course_approval_requests));

