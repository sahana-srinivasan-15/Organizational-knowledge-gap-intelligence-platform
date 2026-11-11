-- ==============================================================================
-- Flyway Migration: V6__dynamic_course_diagnostic_assessments.sql
-- Description: Dynamic course-based diagnostic assessments, question pool expansion,
--              assessment attempts tracking, and rich question metadata.
-- ==============================================================================

-- 1. Extend assessments table with course relationship
ALTER TABLE assessments
    ADD COLUMN IF NOT EXISTS course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);

-- 2. Extend assessment_questions table with course and question metadata
ALTER TABLE assessment_questions
    ADD COLUMN IF NOT EXISTS course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS topic VARCHAR(100),
    ADD COLUMN IF NOT EXISTS explanation TEXT,
    ADD COLUMN IF NOT EXISTS estimated_time_seconds INT DEFAULT 60;

CREATE INDEX IF NOT EXISTS idx_questions_course ON assessment_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON assessment_questions(topic);

-- 3. Create assessment_attempts table for tracking employee attempts per course
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id BIGSERIAL PRIMARY KEY,
    employee_profile_id BIGINT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'ABANDONED')),
    question_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    options_shuffled_json JSONB,
    answers_submitted_json JSONB,
    score DECIMAL(5, 2),
    passed BOOLEAN,
    total_questions INT NOT NULL DEFAULT 0,
    correct_questions INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempts_profile ON assessment_attempts(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_course ON assessment_attempts(course_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON assessment_attempts(status);

-- 4. Extend assessment_submissions with attempt and course links
ALTER TABLE assessment_submissions
    ADD COLUMN IF NOT EXISTS attempt_id BIGINT REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_submissions_course ON assessment_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_attempt ON assessment_submissions(attempt_id);

-- 5. Link existing seeded assessments to courses and enrich existing questions
UPDATE assessments SET course_id = 1 WHERE id = 1 AND course_id IS NULL;
UPDATE assessments SET course_id = 5 WHERE id = 2 AND course_id IS NULL;

-- Enrich existing V2 questions with topic & explanation
UPDATE assessment_questions SET
    course_id = 1,
    topic = 'Configuration Properties',
    explanation = '@ConfigurationProperties provides strong type-safety and hierarchical binding from application.yml or environment variables.',
    estimated_time_seconds = 60
WHERE id = 1 AND topic IS NULL;

UPDATE assessment_questions SET
    course_id = 1,
    topic = 'Transaction Management',
    explanation = 'PROPAGATION_REQUIRED is the default behavior: it joins an existing transaction or starts a new one if none exists.',
    estimated_time_seconds = 60
WHERE id = 2 AND topic IS NULL;

UPDATE assessment_questions SET
    course_id = 1,
    topic = 'Spring Security',
    explanation = 'Stateless authentication replaces session state with request headers (e.g. JWT) verified per request using a stateless filter.',
    estimated_time_seconds = 75
WHERE id = 3 AND topic IS NULL;

UPDATE assessment_questions SET
    course_id = 5,
    topic = 'Java Concurrency',
    explanation = 'ConcurrentHashMap uses bucket-level locking and volatile reads allowing concurrent non-blocking reads.',
    estimated_time_seconds = 60
WHERE id = 4 AND topic IS NULL;

UPDATE assessment_questions SET
    course_id = 5,
    topic = 'Executor Service',
    explanation = 'Exceptions occurring in tasks submitted via ExecutorService.submit() are captured in the Future and rethrown upon calling Future.get().',
    estimated_time_seconds = 60
WHERE id = 5 AND topic IS NULL;

-- 6. Insert Diagnostic Assessments for all remaining courses in catalog
INSERT INTO assessments (id, title, skill_id, course_id, passing_score, time_limit_minutes, description) VALUES
(3, 'Distributed Systems & Microservices Diagnostic', 3, 2, 70.0, 25, 'Evaluates knowledge of distributed consensus, CQRS, caching patterns, and database sharding.'),
(4, 'Production Machine Learning Diagnostic', 6, 3, 70.0, 30, 'Evaluates end-to-end ML pipelines, Scikit-Learn workflows, FastAPI model serving, and latency monitoring.'),
(5, 'PostgreSQL Performance & DBA Diagnostic', 4, 4, 75.0, 20, 'Evaluates query plan analysis, B-Tree indexes, vacuuming, and connection pool optimization.'),
(6, 'Spring Boot 3 & Hibernate Enterprise Diagnostic', 2, 6, 75.0, 25, 'Evaluates Spring Boot 3 autoconfiguration, Hibernate dirty checking, REST APIs, and JPA relations.'),
(7, 'Distributed Systems & Cloud Computing Diagnostic', 3, 7, 70.0, 25, 'Evaluates consensus algorithms (Raft, Paxos), fault tolerance, replication, and distributed storage.'),
(8, 'Data Structures & Algorithms Diagnostic', 1, 8, 70.0, 30, 'Evaluates algorithmic complexity, dynamic programming, tree traversals, and memory management.'),
(9, 'Full Stack React & Spring Boot Diagnostic', 2, 9, 70.0, 25, 'Evaluates React state management, hooks, component lifecycle, REST integration, and CORS.'),
(10, 'Applied Machine Learning in Python Diagnostic', 6, 10, 70.0, 25, 'Evaluates supervised classification, feature engineering, cross-validation, and ROC-AUC metrics.'),
(11, 'PostgreSQL Advanced DBA & Tuning Diagnostic', 4, 11, 75.0, 20, 'Evaluates PostgreSQL partitioning, WAL replication, PgBouncer pooling, and index maintenance.'),
(12, 'Docker & Kubernetes Containerization Diagnostic', 7, 12, 70.0, 25, 'Evaluates container lifecycles, Docker multi-stage builds, Kubernetes pods, and ingress routing.'),
(13, 'System Design Interview Architecture Diagnostic', 3, 13, 75.0, 30, 'Evaluates high-scale architecture, horizontal scaling, rate limiting, and Redis caching tiers.'),
(14, 'Python Core & Data Structures Diagnostic', 5, 14, 70.0, 20, 'Evaluates Python core syntax, generators, list comprehensions, decorators, and data structures.'),
(15, 'CS50 Computer Science Fundamentals Diagnostic', 1, 15, 70.0, 25, 'Evaluates fundamental algorithms, pointers, memory allocation, and software design principles.')
ON CONFLICT (id) DO UPDATE SET
    course_id = EXCLUDED.course_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 7. Seed comprehensive questions pool for each course
-- Course 2: Distributed Systems (Assessment 3)
INSERT INTO assessment_questions (assessment_id, course_id, question_text, options_json, correct_option_index, difficulty_level, topic, explanation, estimated_time_seconds) VALUES
(3, 2, 'What does the CAP theorem state regarding network partitions in distributed systems?', '["A system can guarantee both Consistency and Availability during a partition", "A system must choose between Consistency or Availability when a partition occurs", "Partitions can be prevented using redundant hardware", "Partition tolerance is only required in relational databases"]'::jsonb, 1, 2, 'CAP Theorem', 'When a network partition occurs, a distributed system must sacrifice either immediate consistency or availability.', 60),
(3, 2, 'In the CQRS (Command Query Responsibility Segregation) pattern, what is the primary benefit of separating read and write models?', '["Eliminates the need for transactions", "Allows read and write workloads to scale independently and optimize data schemas", "Guarantees zero database storage", "Replaces asynchronous messaging with synchronous RPC"]'::jsonb, 1, 2, 'CQRS Architecture', 'CQRS enables independent scaling, caching, and denormalization of query models while keeping command models strictly normalized.', 60),
(3, 2, 'Which caching strategy writes data to cache and backing store simultaneously?', '["Write-around", "Write-back", "Write-through", "Cache-aside"]'::jsonb, 2, 2, 'Caching Strategies', 'Write-through updates both the cache and the permanent database in the same synchronous operation.', 60),
(3, 2, 'What is the primary role of a distributed consensus algorithm such as Raft or Paxos?', '["Encrypting network packets between nodes", "Reaching agreement across unreliable nodes on a sequence of state transitions", "Compressing database logs", "Managing OS memory allocation"]'::jsonb, 1, 3, 'Consensus Protocols', 'Consensus protocols ensure a cluster of nodes agrees on log state even in the presence of node crashes and delays.', 75),
(3, 2, 'How does consistent hashing minimize re-keying when a node is added or removed from a cache cluster?', '["It rehashes all keys to index zero", "Only K/n keys need to be remapped on average where K is keys and n is nodes", "It locks all nodes until full redistribution is complete", "It converts all keys to UUIDs"]'::jsonb, 1, 3, 'Consistent Hashing', 'Consistent hashing maps both nodes and keys to a ring, so adding or removing a node only impacts neighboring keys.', 75),
(3, 2, 'Which mechanism prevents cascading failures in a microservices architecture when a downstream service becomes unresponsive?', '["Service Mesh Sidecar", "Circuit Breaker", "Database Sharding", "Dead Letter Queue"]'::jsonb, 1, 2, 'Resilience Patterns', 'Circuit Breakers trip open after a threshold of failures, failing fast and giving the downstream service time to recover.', 60);

-- Course 3: Production ML (Assessment 4)
INSERT INTO assessment_questions (assessment_id, course_id, question_text, options_json, correct_option_index, difficulty_level, topic, explanation, estimated_time_seconds) VALUES
(4, 3, 'Why should feature scaling (e.g. StandardScaler) be fitted only on training data and not the full dataset?', '["To prevent data leakage from the test set into the model training pipeline", "Because test sets are always unscaled", "To decrease floating point memory usage", "Because StandardScaler cannot process numpy arrays"]'::jsonb, 0, 2, 'Data Preprocessing', 'Fitting preprocessors on test or full data leaks future statistical parameters (mean, variance) into training.', 60),
(4, 3, 'In FastAPI, which feature enables high-throughput asynchronous execution for I/O bound prediction endpoints?', '["multiprocessing.Process", "async def route handlers with asyncio", "JVM threads", "Celery canvas only"]'::jsonb, 1, 2, 'FastAPI Architecture', 'async def allows ASGI servers (Uvicorn) to handle concurrent incoming requests on an event loop without blocking on I/O.', 60),
(4, 3, 'What is the purpose of model drift detection in production ML monitoring?', '["Checking if the model binary file has changed", "Detecting degradation in performance due to changes in real-world data distributions (covariate shift)", "Validating user passwords", "Measuring API network latency"]'::jsonb, 1, 2, 'MLOps Monitoring', 'Data drift and concept drift occur when input feature distributions or label relationships shift compared to training data.', 60),
(4, 3, 'Which metric is best suited for evaluating a binary classifier with high class imbalance (e.g., 99% negative cases)?', '["Accuracy", "PR-AUC (Precision-Recall Area Under Curve)", "Mean Squared Error", "R-squared"]'::jsonb, 1, 3, 'Model Evaluation', 'Accuracy is misleading on imbalanced datasets because a trivial majority predictor scores 99%; PR-AUC focuses on the minority positive class.', 75),
(4, 3, 'When deploying a scikit-learn model, why is joblib often preferred over standard pickle for saving model weights?', '["Joblib has built-in HTTP compression", "Joblib efficiently stores large numpy arrays using memory-mapped disk access", "Joblib encrypts the model using AES", "Pickle cannot serialize Python classes"]'::jsonb, 1, 2, 'Model Serialization', 'Joblib is optimized for objects containing large numerical NumPy arrays, serializing them into fast disk buffers.', 60);

-- Course 4: PostgreSQL Performance (Assessment 5)
INSERT INTO assessment_questions (assessment_id, course_id, question_text, options_json, correct_option_index, difficulty_level, topic, explanation, estimated_time_seconds) VALUES
(5, 4, 'What does an "Index Scan" versus "Bitmap Index Scan" indicate in an EXPLAIN ANALYZE output?', '["Index scan reads sequentially while bitmap reads from memory only", "Bitmap index scan builds a memory bitmap of matching heap pages before reading them, reducing random disk I/O", "Index scan is always slower than Seq Scan", "Bitmap scan is only used for primary keys"]'::jsonb, 1, 3, 'Query Plans', 'Bitmap Index Scans collect matching page pointers into a bitmap and sort them by physical disk order, converting random I/O into sequential reads.', 75),
(5, 4, 'What is the primary function of PostgreSQL VACUUM?', '["Deleting uncommitted transactions", "Reclaiming storage occupied by dead row versions (tuples) created by UPDATEs and DELETEs", "Resetting table sequence counters", "Rebuilding database user accounts"]'::jsonb, 1, 2, 'Database Maintenance', 'PostgreSQL MVCC leaves dead tuples after updates/deletes; VACUUM marks these spaces as reusable by new inserts.', 60),
(5, 4, 'Why is a B-Tree index unsuitable for querying array containment (e.g. tags @> ARRAY[''java'']) in PostgreSQL?', '["B-Trees only support exact scalar order comparisons (<, =, >); GIN or GiST indexes are required for set containment", "B-Trees are deprecated in PostgreSQL 16+", "Array columns cannot have indexes in PostgreSQL", "B-Tree indexes cannot exceed 100 rows"]'::jsonb, 0, 3, 'Index Selection', 'B-Trees rely on strict total ordering. Generalized Inverted Indexes (GIN) map individual array elements to row pointers.', 75),
(5, 4, 'Which configuration parameter controls the amount of memory dedicated to individual query sort and hash operations in PostgreSQL?', '["shared_buffers", "work_mem", "maintenance_work_mem", "wal_buffers"]'::jsonb, 1, 2, 'PostgreSQL Tuning', 'work_mem dictates memory allocated per sort/hash node before spilling to temporary files on disk.', 60),
(5, 4, 'What is the advantage of using EXPLAIN (ANALYZE, BUFFERS) over standard EXPLAIN?', '["It rewrites slow queries automatically", "It executes the query and reports actual elapsed time and cache hit/read buffer counts", "It estimates cost without running the query", "It hides table names for security"]'::jsonb, 1, 2, 'Query Optimization', 'ANALYZE executes the query to show actual runtimes; BUFFERS reveals shared buffer cache hits vs physical disk reads.', 60);

-- Course 6: Spring Boot 3 & Hibernate (Assessment 6)
INSERT INTO assessment_questions (assessment_id, course_id, question_text, options_json, correct_option_index, difficulty_level, topic, explanation, estimated_time_seconds) VALUES
(6, 6, 'In Hibernate, what is the "N+1 select problem" and how is it most effectively resolved?', '["A syntax error in HQL queries; resolved by using JDBC", "Fetching parent entities executes 1 query, then accessing a lazy collection triggers N additional queries; resolved using JOIN FETCH or @EntityGraph", "An infinite loop in serialization; resolved with @JsonIgnore", "Database connection pool starvation; resolved with PgBouncer"]'::jsonb, 1, 3, 'JPA Performance', 'JOIN FETCH or JPA EntityGraphs fetch parent and associated child entities in a single combined SQL query.', 75),
(6, 6, 'What happens when an entity is in the "Detached" persistence state in JPA?', '["It is currently locked by a database transaction", "It has a database identity but is no longer associated with an active EntityManager/PersistenceContext", "It has been physically deleted from the database table", "It cannot be serialized to JSON"]'::jsonb, 1, 2, 'JPA Lifecycle', 'Detached entities were previously managed but the persistence context closed; changes are not automatically tracked until re-merged.', 60),
(6, 6, 'In Spring Boot 3, which Java baseline is mandatory?', '["Java 8", "Java 11", "Java 17", "Java 21"]'::jsonb, 2, 1, 'Spring Boot 3 Baseline', 'Spring Boot 3 and Spring Framework 6 require Java 17 as the minimum baseline.', 45),
(6, 6, 'Which HTTP status code should a RESTful API return when a POST request successfully creates a new resource?', '["200 OK", "201 Created", "204 No Content", "202 Accepted"]'::jsonb, 1, 1, 'REST Standards', 'HTTP 201 Created signifies that the request succeeded and resulted in the creation of a new resource.', 45),
(6, 6, 'What is the role of Hibernate Second-Level (L2) Cache?', '["Caches queries only within a single HTTP thread session", "Shares cached entity state across multiple sessions and transactions in the SessionFactory", "Replaces the database with Redis entirely", "Stores compiled bytecode"]'::jsonb, 1, 2, 'Hibernate Caching', 'L1 cache is scoped to the individual EntityManager/Session; L2 cache is scoped to the SessionFactory across all sessions.', 60);

-- Course 9: Full Stack React & Spring Boot (Assessment 9)
INSERT INTO assessment_questions (assessment_id, course_id, question_text, options_json, correct_option_index, difficulty_level, topic, explanation, estimated_time_seconds) VALUES
(9, 9, 'In React, why must hooks like useState and useEffect only be called at the top level of a component?', '["To avoid memory leaks in the browser", "React relies on the order in which hooks are called across renders to preserve state", "Because JavaScript functions cannot nest statements", "To prevent CORS errors"]'::jsonb, 1, 2, 'React Hooks Rules', 'Calling hooks inside loops or conditions alters their invocation order between renders, breaking React''s internal pointer list.', 60),
(9, 9, 'What is the purpose of the CORS (Cross-Origin Resource Sharing) header in a Spring Boot REST API?', '["Encrypting HTTP payloads with SSL", "Allowing a web frontend hosted on a different domain or port to safely access API endpoints", "Compressing JSON responses", "Preventing SQL injection attacks"]'::jsonb, 1, 2, 'CORS & Security', 'Browsers enforce Same-Origin Policy; CORS headers from the server tell the browser to permit cross-origin requests from specific origins.', 60),
(9, 9, 'In modern React, what is the primary benefit of the useEffect cleanup function?', '["It re-renders the component immediately", "It unsubscribes listeners, aborts network requests, or clears timers when the component unmounts or dependencies change", "It validates PropTypes", "It clears localStorage"]'::jsonb, 1, 2, 'React Lifecycle', 'The cleanup function prevents stale callbacks and memory leaks by cancelling subscriptions before the effect runs again or on unmount.', 60),
(9, 9, 'How should JWT tokens typically be transmitted from a React client to a Spring Boot backend?', '["Inside the URL query string", "In the Authorization header with Bearer prefix", "In an HTML form action attribute", "In the HTTP User-Agent header"]'::jsonb, 1, 1, 'Authentication Protocol', 'Bearer authentication in the Authorization header (Authorization: Bearer <token>) is the standard REST pattern.', 45),
(9, 9, 'What is the Virtual DOM in React and why is it used?', '["A full browser window emulator in WebAssembly", "An in-memory lightweight representation of the real DOM used for reconciliation to batch and minimize costly DOM mutations", "A database for storing user sessions", "A CSS rendering engine"]'::jsonb, 1, 2, 'Virtual DOM', 'Direct DOM manipulations are expensive; React diffs the virtual tree and updates only the necessary nodes in the real browser DOM.', 60);

-- Course 12: Docker & Kubernetes (Assessment 12)
INSERT INTO assessment_questions (assessment_id, course_id, question_text, options_json, correct_option_index, difficulty_level, topic, explanation, estimated_time_seconds) VALUES
(12, 12, 'What is the primary advantage of multi-stage Docker builds?', '["Enables running multiple containers in one image", "Minimizes the final production image size by separating build tools from the runtime artifacts", "Accelerates CPU clock speed", "Encrypts container network traffic"]'::jsonb, 1, 2, 'Docker Multi-stage', 'Multi-stage builds allow compiling code with heavy SDKs in stage 1, then copying only the built binary into a lightweight JRE/distroless image in stage 2.', 60),
(12, 12, 'In Kubernetes, what is the smallest deployable computing unit that can be created and managed?', '["Deployment", "Pod", "Service", "Node"]'::jsonb, 1, 1, 'Kubernetes Core', 'A Pod represents a single instance of a running process and encapsulates one or more co-located containers.', 45),
(12, 12, 'What is the purpose of a Kubernetes Readiness Probe?', '["Determines if the container process has crashed and needs restarting", "Determines if a container is ready to accept incoming network traffic from a Service", "Scans the container for vulnerabilities", "Backs up the container storage"]'::jsonb, 1, 2, 'Health Probes', 'Liveness probes restart failed containers; Readiness probes remove the pod from service endpoints until it is ready to serve traffic.', 60),
(12, 12, 'In Docker Compose, what does the "depends_on" condition ensure?', '["That dependent services have passed health checks before starting (with condition: service_healthy)", "That services use the same IP address", "That containers share disk partitions", "That image layers are downloaded in parallel"]'::jsonb, 0, 2, 'Docker Compose', 'depends_on controls startup order, and with service_healthy it waits for the target service healthcheck to pass.', 60),
(12, 12, 'Which Kubernetes object provides HTTP and HTTPS routing from outside the cluster to internal services based on hostnames or paths?', '["ClusterIP Service", "Ingress", "ConfigMap", "DaemonSet"]'::jsonb, 1, 2, 'Ingress Controller', 'An Ingress exposes HTTP and HTTPS routes from outside the cluster to services within the cluster.', 60);

-- Course 14: Python for Everybody (Assessment 14)
INSERT INTO assessment_questions (assessment_id, course_id, question_text, options_json, correct_option_index, difficulty_level, topic, explanation, estimated_time_seconds) VALUES
(14, 14, 'What is the difference between a Python list and a Python tuple?', '["Lists are immutable while tuples are mutable", "Lists are mutable while tuples are immutable", "Tuples cannot store integers", "Lists cannot be indexed"]'::jsonb, 1, 1, 'Data Types', 'Lists can be modified after creation (mutable), whereas tuples cannot have elements modified or appended (immutable).', 45),
(14, 14, 'In Python, what is the time complexity of looking up a key in a standard dictionary on average?', '["O(n)", "O(log n)", "O(1)", "O(n^2)"]'::jsonb, 2, 2, 'Algorithm Complexity', 'Python dictionaries are implemented as hash tables, giving average O(1) constant time lookups.', 45),
(14, 14, 'What does the "yield" keyword do inside a Python function?', '["Terminates the program immediately", "Converts the function into a generator that produces values lazily on demand", "Raises an unhandled exception", "Locks a thread"]'::jsonb, 1, 2, 'Generators', 'yield turns a function into a generator iterator, pausing execution and yielding a value without losing function state.', 60),
(14, 14, 'Which built-in Python function is used to safely open and automatically close file handles using a context manager?', '["open() with the with statement", "file.load()", "sys.open()", "io.read()"]'::jsonb, 0, 1, 'File I/O', 'The with open(...) as f: context manager guarantees the file stream is closed even if exceptions occur.', 45),
(14, 14, 'What does a Python decorator do?', '["Formats strings with HTML colors", "Wraps another function to extend or modify its behavior without altering its source code", "Creates database indexes", "Compiles Python code to C"]'::jsonb, 1, 2, 'Decorators', 'A decorator is a callable that takes a function as argument and returns an enhanced wrapper function.', 60);

-- Reset all primary key sequences safely
SELECT setval('assessments_id_seq', (SELECT MAX(id) FROM assessments));
SELECT setval('assessment_questions_id_seq', (SELECT MAX(id) FROM assessment_questions));
SELECT setval('assessment_attempts_id_seq', COALESCE((SELECT MAX(id) FROM assessment_attempts), 1));
SELECT setval('assessment_submissions_id_seq', COALESCE((SELECT MAX(id) FROM assessment_submissions), 1));
