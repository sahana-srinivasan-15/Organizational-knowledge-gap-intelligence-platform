-- ==============================================================================
-- Flyway Migration: V5__add_course_approval_and_mentoring_tracking.sql
-- Description: Adds course approval requests, mentoring sessions, and learning milestones
-- ==============================================================================

-- 1. Course Approval Requests Table
CREATE TABLE course_approval_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    external_course_title VARCHAR(255) NOT NULL,
    external_course_provider VARCHAR(100) NOT NULL,
    external_course_url VARCHAR(500),
    price DECIMAL(10, 2) DEFAULT 0.00,
    duration_hours INT DEFAULT 10,
    difficulty_level VARCHAR(30) DEFAULT 'BEGINNER',
    rating DECIMAL(3, 2) DEFAULT 4.50,
    target_skill_id BIGINT REFERENCES skills(id) ON DELETE SET NULL,
    target_skill_name VARCHAR(100),
    reason TEXT NOT NULL,
    expected_outcome TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'IN_PROGRESS', 'COMPLETED')),
    manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    manager_comment TEXT,
    alternative_course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    recommended_mentor_id BIGINT REFERENCES employee_profiles(id) ON DELETE SET NULL,
    target_completion_date DATE,
    learning_path_id BIGINT REFERENCES learning_paths(id) ON DELETE SET NULL,
    learning_path_course_id BIGINT REFERENCES learning_path_courses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_course_req_profile ON course_approval_requests(employee_profile_id);
CREATE INDEX idx_course_req_manager ON course_approval_requests(manager_id);
CREATE INDEX idx_course_req_status ON course_approval_requests(status);
CREATE INDEX idx_course_req_skill ON course_approval_requests(target_skill_id);

-- 2. Mentoring Sessions Table (Persistent session history replacing localStorage)
CREATE TABLE mentoring_sessions (
    id BIGSERIAL PRIMARY KEY,
    mentor_assignment_id BIGINT NOT NULL REFERENCES mentor_assignments(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45 CHECK (duration_minutes > 0),
    notes TEXT,
    feedback TEXT,
    action_items TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    next_session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_assignment ON mentoring_sessions(mentor_assignment_id);
CREATE INDEX idx_sessions_date ON mentoring_sessions(session_date);

-- 3. Learning Milestones Table (Granular goals for mentee progress tracking)
CREATE TABLE learning_milestones (
    id BIGSERIAL PRIMARY KEY,
    mentor_assignment_id BIGINT REFERENCES mentor_assignments(id) ON DELETE CASCADE,
    learning_path_course_id BIGINT REFERENCES learning_path_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    completed_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_milestones_assignment ON learning_milestones(mentor_assignment_id);
CREATE INDEX idx_milestones_path_course ON learning_milestones(learning_path_course_id);

-- 4. Seed Additional Real External Courses across Coursera, Udemy, edX, YouTube, and Internal
INSERT INTO courses (id, title, provider, duration_hours, difficulty_level, rating, course_url, description) VALUES
(5, 'Java Programming Masterclass: Java 17 to Java 21', 'Udemy', 80, 'BEGINNER', 4.70, 'https://www.udemy.com/course/java-the-complete-java-developer-course/', 'Complete core Java mastery covering OOP, Collections, Concurrency, Lambdas, Streams, and JVM performance tuning.'),
(6, 'Spring Boot 3, Spring 6 & Hibernate for Beginners', 'Udemy', 42, 'INTERMEDIATE', 4.80, 'https://www.udemy.com/course/spring-hibernate-tutorial/', 'Build enterprise REST APIs with Spring Data JPA, Spring Security, JWT authentication, and Docker container deployment.'),
(7, 'Distributed Systems and Cloud Computing', 'Coursera', 32, 'ADVANCED', 4.90, 'https://www.coursera.org/learn/cloud-computing', 'Illinois Tech specialization in consensus algorithms (Raft, Paxos), distributed key-value stores, and fault tolerance.'),
(8, 'Data Structures and Software Design Specialization', 'Coursera', 45, 'INTERMEDIATE', 4.85, 'https://www.coursera.org/specializations/data-structures-algorithms', 'UC San Diego curriculum on Algorithmic complexity, Trees, Graphs, Dynamic Programming, and System Optimization.'),
(9, 'Full Stack Web Development with React and Spring Boot', 'Coursera', 36, 'INTERMEDIATE', 4.75, 'https://www.coursera.org/learn/full-stack-react-spring', 'End-to-end full-stack architectures integrating modern React frontend, Vite, RESTful Spring Boot, and PostgreSQL.'),
(10, 'Applied Machine Learning in Python', 'Coursera', 34, 'INTERMEDIATE', 4.80, 'https://www.coursera.org/learn/python-machine-learning', 'University of Michigan program covering Scikit-Learn pipelines, supervised classifiers, dimensionality reduction, and evaluation.'),
(11, 'PostgreSQL Bootcamp: Beginner to Advanced DBA', 'Udemy', 26, 'ADVANCED', 4.85, 'https://www.udemy.com/course/postgresql-bootcamp/', 'Indexes, query plans, partitioning, vacuuming, connection pooling with PgBouncer, and high availability replication.'),
(12, 'Docker & Kubernetes: The Practical Guide', 'Udemy', 23, 'BEGINNER', 4.85, 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', 'Container lifecycle, multi-stage Dockerfiles, Docker Compose networks, Kubernetes pods, deployments, and services.'),
(13, 'System Design Interview – Step by Step Guide', 'YouTube Learning', 14, 'ADVANCED', 4.90, 'https://www.youtube.com/watch?v=bUHFg8CZFCA', 'High-level architecture walkthroughs: scalable load balancing, horizontal sharding, Redis caching tiers, and message queues.'),
(14, 'Python for Everybody Specialization', 'Coursera', 40, 'BEGINNER', 4.85, 'https://www.coursera.org/specializations/python', 'Foundational Python programming, data structures, networked application interfaces, and SQLite/PostgreSQL interaction.'),
(15, 'CS50: Introduction to Computer Science', 'edX', 60, 'BEGINNER', 4.95, 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x', 'Harvard University CS50 curriculum in algorithmic thinking, data structures, resource management, and software engineering.')
ON CONFLICT (id) DO NOTHING;

-- Map newly seeded courses to skills
INSERT INTO course_skills (course_id, skill_id, target_proficiency_gain) VALUES
(5, 1, 2), -- Java gain +2
(6, 2, 2), -- Spring Boot gain +2
(7, 3, 2), -- System Design gain +2
(8, 1, 2), -- Java / Algorithms gain +2
(9, 2, 1), -- Spring Boot gain +1
(9, 1, 1), -- Java gain +1
(10, 6, 2), -- ML gain +2
(10, 5, 1), -- Python gain +1
(11, 4, 2), -- PostgreSQL gain +2
(12, 7, 2), -- Docker gain +2
(13, 3, 2), -- System Design gain +2
(14, 5, 2), -- Python gain +2
(15, 1, 1)  -- Java gain +1
ON CONFLICT DO NOTHING;

-- 5. Seed Sample Course Approval Requests
INSERT INTO course_approval_requests (
    id, employee_profile_id, course_id, external_course_title, external_course_provider,
    external_course_url, price, duration_hours, difficulty_level, rating,
    target_skill_id, target_skill_name, reason, expected_outcome, priority,
    status, manager_id, manager_comment, target_completion_date, created_at
) VALUES
(1, 2, 6, 'Spring Boot 3, Spring 6 & Hibernate for Beginners', 'Udemy',
 'https://www.udemy.com/course/spring-hibernate-tutorial/', 29.99, 42, 'INTERMEDIATE', 4.80,
 2, 'Spring Boot Framework',
 'I have identified a level 3 proficiency gap in Spring Boot compared to my target Senior Software Engineer role requirements.',
 'Achieve full competency in Spring Security, transaction isolation, and containerized deployment.',
 'HIGH', 'PENDING', 2, NULL, CURRENT_DATE + INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

(2, 2, 7, 'Distributed Systems and Cloud Computing', 'Coursera',
 'https://www.coursera.org/learn/cloud-computing', 49.00, 32, 'ADVANCED', 4.90,
 3, 'System Design & Architecture',
 'Requested to bridge system design gap for microservice decomposition and consensus management.',
 'Design scalable distributed transaction handling with Saga patterns.',
 'MEDIUM', 'APPROVED', 2, 'Approved. Essential for your H2 promotion milestones. Assigned mentor Alex Morgan for architecture reviews.', CURRENT_DATE + INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- Link approved course request #2 to learning path 1
UPDATE course_approval_requests
SET learning_path_id = 1, learning_path_course_id = 1, reviewed_at = CURRENT_TIMESTAMP - INTERVAL '14 days'
WHERE id = 2;

-- 6. Seed Sample Mentoring Sessions (only if at least one mentor assignment exists)
INSERT INTO mentoring_sessions (
    id, mentor_assignment_id, topic, session_date, duration_minutes, notes, feedback, action_items, status, next_session_date
)
SELECT
    v.id, ma.id, v.topic, v.session_date, v.duration_minutes, v.notes, v.feedback, v.action_items, v.status, v.next_session_date
FROM (
    VALUES
    (1, 'Spring Boot Architecture & Security In-Depth', CURRENT_DATE - INTERVAL '10 days', 60,
     'Reviewed David''s implementation of JWT authentication filters and JPA transaction boundaries.',
     'Solid understanding of stateless filter chains. Need more practice with custom AccessDenied handlers.',
     '1. Refactor authentication entry point. 2. Write integration tests with MockMvc.', 'COMPLETED', CURRENT_DATE + INTERVAL '4 days'),
    (2, 'Microservices Resiliency & Circuit Breakers', CURRENT_DATE - INTERVAL '3 days', 45,
     'Walkthrough of Resilience4j circuit breakers, retry policies, and fallback mechanisms.',
     'Good progress on rate limiting concepts. Demonstrated proactive questions on distributed tracing.',
     '1. Configure Micrometer metrics. 2. Implement timeout failover in RestClient.', 'COMPLETED', CURRENT_DATE + INTERVAL '7 days')
) AS v(id, topic, session_date, duration_minutes, notes, feedback, action_items, status, next_session_date)
CROSS JOIN (
    SELECT id FROM mentor_assignments ORDER BY id LIMIT 1
) ma
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Sample Learning Milestones (linking dynamically to available mentor assignment, path course, and manager if present)
INSERT INTO learning_milestones (
    id, mentor_assignment_id, learning_path_course_id, title, description, target_date, completed_date, status, created_by_user_id
)
SELECT
    v.id, ma.id, lpc.id, v.title, v.description, v.target_date, v.completed_date, v.status, u.id
FROM (
    VALUES
    (1, 'Complete Spring Boot Core Modules 1-4', 'Study autoconfiguration, bean lifecycles, and JPA repository queries.', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '6 days', 'COMPLETED'),
    (2, 'Implement JWT Authentication & RBAC', 'Build full security configuration with stateless JWT validation.', CURRENT_DATE + INTERVAL '5 days', NULL::DATE, 'IN_PROGRESS'),
    (3, 'End-to-End Microservice Resilience Test', 'Simulate network latency and verify circuit breaker trip and recovery.', CURRENT_DATE + INTERVAL '20 days', NULL::DATE, 'PENDING')
) AS v(id, title, description, target_date, completed_date, status)
LEFT JOIN (SELECT id FROM mentor_assignments ORDER BY id LIMIT 1) ma ON true
LEFT JOIN (SELECT id FROM learning_path_courses ORDER BY id LIMIT 1) lpc ON true
LEFT JOIN (SELECT id FROM users WHERE role = 'MANAGER' ORDER BY id LIMIT 1) u ON true
ON CONFLICT (id) DO NOTHING;

-- 8. Synchronize sequences safely
SELECT setval('courses_id_seq', COALESCE((SELECT MAX(id) FROM courses), 1));
SELECT setval('course_approval_requests_id_seq', COALESCE((SELECT MAX(id) FROM course_approval_requests), 1));
SELECT setval('mentoring_sessions_id_seq', COALESCE((SELECT MAX(id) FROM mentoring_sessions), 1));
SELECT setval('learning_milestones_id_seq', COALESCE((SELECT MAX(id) FROM learning_milestones), 1));
