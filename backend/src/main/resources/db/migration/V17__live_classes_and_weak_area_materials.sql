-- V17: Live Classes and Weak Area Materials & Review System

-- 1. Create live_classes table
CREATE TABLE IF NOT EXISTS live_classes (
    id BIGSERIAL PRIMARY KEY,
    mentor_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skill_id BIGINT REFERENCES skills(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    meeting_url VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UPCOMING',
    recording_url VARCHAR(500),
    materials_url VARCHAR(500),
    max_participants INT DEFAULT 50,
    current_attendees INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT live_classes_status_check CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_live_classes_mentor ON live_classes(mentor_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_skill ON live_classes(skill_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_status ON live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled_at ON live_classes(scheduled_at);

-- 2. Create skill_materials table
CREATE TABLE IF NOT EXISTS skill_materials (
    id BIGSERIAL PRIMARY KEY,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_type VARCHAR(50) NOT NULL DEFAULT 'CHEATSHEET',
    difficulty_level VARCHAR(30) NOT NULL DEFAULT 'INTERMEDIATE',
    estimated_minutes INT DEFAULT 30,
    url VARCHAR(500) NOT NULL,
    provider VARCHAR(100) DEFAULT 'OrgKGI Academy',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT skill_materials_type_check CHECK (material_type IN ('CHEATSHEET', 'LAB_EXERCISE', 'OFFICIAL_DOCS', 'VIDEO_GUIDE', 'PRACTICE_QUIZ')),
    CONSTRAINT skill_materials_diff_check CHECK (difficulty_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'))
);

CREATE INDEX IF NOT EXISTS idx_skill_materials_skill ON skill_materials(skill_id);

-- 3. Create weak_area_reviews table
CREATE TABLE IF NOT EXISTS weak_area_reviews (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    material_id BIGINT REFERENCES skill_materials(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    mentor_id BIGINT REFERENCES employee_profiles(id) ON DELETE SET NULL,
    mentor_feedback TEXT,
    completion_status VARCHAR(30) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT weak_area_reviews_status_check CHECK (completion_status IN ('IN_PROGRESS', 'REVIEWED', 'MASTERED'))
);

CREATE INDEX IF NOT EXISTS idx_weak_area_reviews_emp ON weak_area_reviews(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_weak_area_reviews_skill ON weak_area_reviews(skill_id);
CREATE INDEX IF NOT EXISTS idx_weak_area_reviews_mentor ON weak_area_reviews(mentor_id);

-- 4. Update mentor capacity & assign active mentees to ALL mentors
UPDATE employee_profiles SET max_mentees = 5, mentor_opt_in = true WHERE id = 4;
UPDATE employee_profiles SET max_mentees = 5, mentor_opt_in = true WHERE id = 3;
UPDATE employee_profiles SET max_mentees = 5, mentor_opt_in = true WHERE id = 2;
UPDATE employee_profiles SET max_mentees = 5, mentor_opt_in = true WHERE id = 1;

-- Assign Marcus Vance (Profile 8) to Alex Morgan (Profile 4, MENTOR) on Spring Boot (Skill 2)
INSERT INTO mentor_assignments (mentee_id, mentor_id, skill_id, status, manager_id, assigned_at, notes)
SELECT 8, 4, 2, 'APPROVED_BY_MANAGER', 2, CURRENT_TIMESTAMP, 'Active pairing assigned by Engineering Manager for Spring Boot mastery.'
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments WHERE mentee_id = 8 AND mentor_id = 4 AND skill_id = 2
);

-- Assign Maya Patel (Profile 7) to Alex Morgan (Profile 4, MENTOR) on Java Programming (Skill 1)
INSERT INTO mentor_assignments (mentee_id, mentor_id, skill_id, status, manager_id, assigned_at, notes)
SELECT 7, 4, 1, 'APPROVED_BY_MANAGER', 2, CURRENT_TIMESTAMP, 'Active pairing for Java OOP and concurrency upskilling.'
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments WHERE mentee_id = 7 AND mentor_id = 4 AND skill_id = 1
);

-- Assign Maya Patel (Profile 7) to Priya Sharma (Profile 5, MENTOR) on System Design (Skill 3)
INSERT INTO mentor_assignments (mentee_id, mentor_id, skill_id, status, manager_id, assigned_at, notes)
SELECT 7, 5, 3, 'APPROVED_BY_MANAGER', 2, CURRENT_TIMESTAMP, 'Targeted architectural coaching for distributed microservices.'
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments WHERE mentee_id = 7 AND mentor_id = 5 AND skill_id = 3
);

-- Assign Marcus Vance (Profile 8) to Liam Chen (Profile 6, MENTOR) on PostgreSQL (Skill 4)
INSERT INTO mentor_assignments (mentee_id, mentor_id, skill_id, status, manager_id, assigned_at, notes)
SELECT 8, 6, 4, 'APPROVED_BY_MANAGER', 2, CURRENT_TIMESTAMP, 'Database query execution and index optimization mentoring.'
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments WHERE mentee_id = 8 AND mentor_id = 6 AND skill_id = 4
);

-- Assign Marcus Vance (Profile 8) to Liam Chen (Profile 6, MENTOR) on Docker (Skill 7)
INSERT INTO mentor_assignments (mentee_id, mentor_id, skill_id, status, manager_id, assigned_at, notes)
SELECT 8, 6, 7, 'APPROVED_BY_MANAGER', 2, CURRENT_TIMESTAMP, 'Production container orchestration and multi-stage builds.'
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments WHERE mentee_id = 8 AND mentor_id = 6 AND skill_id = 7
);

-- Assign Priya Raman (Profile 14) to Elena Rostova (Profile 3, MENTOR) on Python (Skill 5)
INSERT INTO mentor_assignments (mentee_id, mentor_id, skill_id, status, manager_id, assigned_at, notes)
SELECT 14, 3, 5, 'APPROVED_BY_MANAGER', 2, CURRENT_TIMESTAMP, 'Python data science stack and analytics pipeline mentorship.'
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments WHERE mentee_id = 14 AND mentor_id = 3 AND skill_id = 5 AND status = 'APPROVED_BY_MANAGER'
);

-- Assign Priya Raman (Profile 14) to David Kim (Profile 2, MENTOR) on Java Programming (Skill 1)
INSERT INTO mentor_assignments (mentee_id, mentor_id, skill_id, status, manager_id, assigned_at, notes)
SELECT 14, 2, 1, 'APPROVED_BY_MANAGER', 2, CURRENT_TIMESTAMP, 'Core Java fundamentals and test-driven development coaching.'
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments WHERE mentee_id = 14 AND mentor_id = 2 AND skill_id = 1 AND status = 'APPROVED_BY_MANAGER'
);

-- Synchronize current_mentee_count accurately across all mentors
UPDATE employee_profiles ep
SET current_mentee_count = (
    SELECT COUNT(DISTINCT mentee_id)
    FROM mentor_assignments ma
    WHERE ma.mentor_id = ep.id
      AND ma.status IN ('APPROVED_BY_MANAGER', 'ACTIVE')
)
WHERE ep.mentor_opt_in = true;

-- 5. Seed Curated Study Materials for Weak Areas
INSERT INTO skill_materials (id, skill_id, title, description, material_type, difficulty_level, estimated_minutes, url, provider)
VALUES
    (1, 1, 'Modern Java Concurrency & Virtual Threads Handbook', 'Complete architectural reference covering java.util.concurrent, CompletableFuture, and Java 21 Project Loom virtual threads.', 'CHEATSHEET', 'INTERMEDIATE', 25, 'https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html', 'Oracle Official Docs'),
    (2, 1, 'Hands-on JVM Memory Management & Garbage Collection Lab', 'Interactive profiling and troubleshooting guide for ZGC, G1GC tuning, and heap memory analysis.', 'LAB_EXERCISE', 'ADVANCED', 45, 'https://www.baeldung.com/jvm-garbage-collectors', 'Baeldung Enterprise'),
    (3, 2, 'Spring Boot 3 Security & OAuth2 Filter Chain Cheatsheet', 'Step-by-step security implementation for JWT validation, CSRF protection, and method security annotations.', 'CHEATSHEET', 'INTERMEDIATE', 20, 'https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html', 'Spring Guides'),
    (4, 2, 'Hands-on Cloud-Native Microservices with Spring Boot Lab', 'Architecting resilient services with Spring Cloud Gateway, Resilience4j circuit breakers, and Eureka.', 'LAB_EXERCISE', 'ADVANCED', 50, 'https://spring.io/guides/gs/centralized-configuration/', 'Spring Official'),
    (5, 3, 'Distributed Systems Architecture & Caching Patterns', 'In-depth reference covering Cache-Aside, Write-Through, Redis clustered topologies, and CAP theorem trade-offs.', 'CHEATSHEET', 'INTERMEDIATE', 30, 'https://redis.io/docs/manual/patterns/', 'Redis Core Architecture'),
    (6, 3, 'Designing Fault-Tolerant Distributed Architecture Lab', 'Hands-on scenario designing 99.999% SLA microservices with event-driven CQRS and Apache Kafka messaging.', 'LAB_EXERCISE', 'ADVANCED', 60, 'https://microservices.io/patterns/index.html', 'Microservices.io'),
    (7, 4, 'PostgreSQL EXPLAIN ANALYZE & Query Optimization Field Guide', 'Deciphering query plans, index scans vs sequential scans, buffer hits, and query execution bottlenecks.', 'CHEATSHEET', 'INTERMEDIATE', 25, 'https://www.postgresql.org/docs/current/using-explain.html', 'PostgreSQL Global Group'),
    (8, 4, 'Hands-on PostgreSQL Partitioning & Vacuum Tuning Lab', 'Declarative range/hash partitioning, autovacuum parameters tuning, and transaction ID wraparound prevention.', 'LAB_EXERCISE', 'ADVANCED', 45, 'https://www.postgresql.org/docs/current/ddl-partitioning.html', 'PostgreSQL Lab'),
    (9, 5, 'Pandas & NumPy Vectorized Operations Cheatsheet', 'High-performance data manipulation, memory-efficient vector operations, and time-series aggregation.', 'CHEATSHEET', 'BEGINNER', 20, 'https://pandas.pydata.org/docs/user_guide/10min.html', 'PyData Open Source'),
    (10, 6, 'Scikit-Learn Model Selection & Pipeline Serialization', 'Production ML pipelines with StandardScaler, ColumnTransformer, cross-validation, and Joblib model persistence.', 'CHEATSHEET', 'INTERMEDIATE', 30, 'https://scikit-learn.org/stable/modules/cross_validation.html', 'Scikit-Learn Docs'),
    (11, 7, 'Production Dockerfile Best Practices & Multi-Stage Builds', 'Building distroless minimal container images, layer caching strategies, and non-root security principles.', 'CHEATSHEET', 'INTERMEDIATE', 25, 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/', 'Docker Official Docs'),
    (12, 7, 'Container Networking & Docker Compose Orchestration Lab', 'Configuring isolated bridge networks, overlay networks, and local multi-service container topologies.', 'LAB_EXERCISE', 'INTERMEDIATE', 40, 'https://docs.docker.com/compose/gettingstarted/', 'Docker Enterprise')
ON CONFLICT (id) DO NOTHING;

SELECT setval('skill_materials_id_seq', (SELECT MAX(id) FROM skill_materials));

-- 6. Seed Initial Weak Area Reviews & Mentor Feedback
INSERT INTO weak_area_reviews (id, employee_profile_id, skill_id, material_id, rating, review_text, mentor_id, mentor_feedback, completion_status)
VALUES
    (1, 2, 4, 7, 5, 'The EXPLAIN ANALYZE cheatsheet and vacuum tuning guide helped me understand sequential scan bottlenecks in our order search queries.', 6, 'Outstanding progress on index selection. Remember to inspect buffer cache hit ratios and prefer composite B-tree indexes for compound WHERE conditions.', 'REVIEWED'),
    (2, 8, 7, 11, 4, 'Multi-stage builds reduced our base image from 850MB to 120MB. Very practical lab that directly improved our deployment pipeline.', 6, 'Great reduction in container footprint. Make sure non-root USER directives and read-only root filesystems are enforced in staging.', 'IN_PROGRESS'),
    (3, 7, 3, 5, 5, 'The distributed caching patterns resource clearly clarified cache-aside vs write-through strategies for our inventory service.', 5, 'Solid grasp of caching fundamentals. Next milestone: implement circuit-breaker and retry fallback policies using Resilience4j.', 'REVIEWED'),
    (4, 7, 1, 1, 4, 'Virtual threads and structured concurrency guide helped me refactor blocking I/O calls without thread exhaustion.', 4, 'Excellent initiative. Ensure synchronized blocks are avoided around blocking calls to prevent carrier thread pinning.', 'REVIEWED')
ON CONFLICT (id) DO NOTHING;

SELECT setval('weak_area_reviews_id_seq', (SELECT MAX(id) FROM weak_area_reviews));

-- 7. Seed Live Classes
INSERT INTO live_classes (id, mentor_id, title, description, skill_id, scheduled_at, duration_minutes, meeting_url, status, recording_url, materials_url, max_participants, current_attendees)
VALUES
    (1, 4, 'Spring Boot 3 & Virtual Threads in High-Throughput Microservices', 'Live interactive deep-dive into Spring Boot 3 on Java 21: configuring Tomcat virtual threads, benchmarking concurrent request throughput, and thread pinning diagnostics.', 2, CURRENT_TIMESTAMP - INTERVAL '15 minutes', 60, 'https://meet.google.com/org-live-boot', 'LIVE', NULL, 'https://github.com/spring-projects/spring-boot', 50, 18),
    (2, 5, 'High-Scale System Architecture: Designing 99.999% Fault-Tolerant Clusters', 'Interactive architectural workshop on building active-active multi-region clusters, quorum consistency, and automated failover mechanics.', 3, CURRENT_TIMESTAMP + INTERVAL '2 hours', 90, 'https://meet.google.com/org-sys-arch', 'UPCOMING', NULL, 'https://microservices.io/patterns/index.html', 75, 34),
    (3, 6, 'PostgreSQL Index Optimization & Execution Plan Deep-Dive', 'Live demonstration of indexing strategies, diagnosing sequential scans, index bloat remediation, and optimizing high-volume OLTP queries.', 4, CURRENT_TIMESTAMP + INTERVAL '1 day 3 hours', 60, 'https://meet.google.com/org-pg-tune', 'UPCOMING', NULL, 'https://www.postgresql.org/docs/current/performance-tips.html', 50, 22),
    (4, 3, 'Production AI Workflows & Scikit-Learn Pipeline Serialization', 'End-to-end walkthrough of building reproducible machine learning pipelines, custom transformer steps, and low-latency model inference APIs.', 6, CURRENT_TIMESTAMP - INTERVAL '2 days', 75, 'https://meet.google.com/org-ml-pipe', 'COMPLETED', 'https://www.youtube.com/watch?v=0Lt9w-BxKFQ', 'https://scikit-learn.org/stable/modules/compose.html', 50, 46),
    (5, 2, 'Docker Multi-Stage Builds & Distroless Container Hardening', 'Hands-on session on creating hardened, secure distroless containers with multi-stage compilation and minimal attack surface.', 7, CURRENT_TIMESTAMP + INTERVAL '3 days 4 hours', 45, 'https://meet.google.com/org-docker-sec', 'UPCOMING', NULL, 'https://docs.docker.com/build/building/multi-stage/', 40, 15)
ON CONFLICT (id) DO NOTHING;

SELECT setval('live_classes_id_seq', (SELECT MAX(id) FROM live_classes));

