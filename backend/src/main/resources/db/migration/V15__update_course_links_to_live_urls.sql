-- ==============================================================================
-- Flyway Migration: V15__update_course_links_to_live_urls.sql
-- Description: Update legacy/broken course URLs with live, verified Coursera links
-- ==============================================================================

-- 1. Course 1: Advanced Spring Boot Microservices in Production
UPDATE courses 
SET provider = 'Coursera', 
    course_url = 'https://www.coursera.org/learn/java-spring-boot',
    description = 'Hands-on microservices development with Java, Spring Boot, REST APIs, and cloud-native container architectures.'
WHERE id = 1;

-- 2. Course 2: Distributed Systems Architecture & Design Patterns
UPDATE courses 
SET provider = 'Coursera', 
    course_url = 'https://www.coursera.org/learn/service-oriented-architecture',
    description = 'Master service-oriented architecture, microservice boundaries, distributed communication patterns, and cloud scalability.'
WHERE id = 2;

-- 3. Course 3: Production Machine Learning with Scikit-Learn & FastAPI
UPDATE courses 
SET provider = 'Coursera', 
    course_url = 'https://www.coursera.org/learn/introduction-to-machine-learning-in-production',
    description = 'End-to-end production ML lifecycle: baseline models, deployment pipelines, concept drift monitoring, and latency optimization.'
WHERE id = 3;

-- 4. Course 4: PostgreSQL Database Performance Tuning & Indexing
UPDATE courses 
SET provider = 'Coursera', 
    course_url = 'https://www.coursera.org/learn/intermediate-postgresql',
    description = 'Advanced relational database optimization: query execution plans, B-tree indexing strategies, transactions, and performance tuning.'
WHERE id = 4;

-- 5. Course 9: Full Stack Web Development with React and Spring Boot
UPDATE courses 
SET provider = 'Coursera', 
    course_url = 'https://www.coursera.org/learn/advanced-react',
    description = 'Modern React architecture, hooks, state management, full-stack API integration, and frontend engineering principles.'
WHERE id = 9;

-- 6. Course 43: Cloud Native Java and Spring Microservices (if present)
UPDATE courses 
SET provider = 'Coursera', 
    course_url = 'https://www.coursera.org/learn/java-spring-boot'
WHERE id = 43;

-- 7. Update course approval requests referencing dead or broken URLs
UPDATE course_approval_requests 
SET external_course_url = 'https://www.coursera.org/learn/service-oriented-architecture'
WHERE external_course_url = 'https://academy.orgkgi.dev/courses/system-design';

UPDATE course_approval_requests 
SET external_course_url = 'https://www.coursera.org/learn/java-spring-boot'
WHERE external_course_url = 'https://academy.orgkgi.dev/courses/spring-boot-adv';

UPDATE course_approval_requests 
SET external_course_url = 'https://www.coursera.org/learn/introduction-to-machine-learning-in-production'
WHERE external_course_url = 'https://academy.orgkgi.dev/courses/ml-prod';

UPDATE course_approval_requests 
SET external_course_url = 'https://www.coursera.org/learn/intermediate-postgresql'
WHERE external_course_url = 'https://academy.orgkgi.dev/courses/postgres-tuning';

UPDATE course_approval_requests 
SET external_course_url = 'https://www.coursera.org/learn/advanced-react'
WHERE external_course_url = 'https://www.coursera.org/learn/full-stack-react-spring';

UPDATE course_approval_requests 
SET external_course_url = 'https://www.coursera.org/learn/java-spring-boot'
WHERE external_course_url = 'https://www.coursera.org/learn/java-spring-cloud-microservices';

