package com.orgkgi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.assessment.GeneratedQuestionSpec;
import com.orgkgi.entity.Assessment;
import com.orgkgi.entity.AssessmentQuestion;
import com.orgkgi.entity.Course;
import com.orgkgi.entity.CourseSkill;
import com.orgkgi.repository.AssessmentQuestionRepository;
import com.orgkgi.repository.CourseSkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Generates and validates curriculum-aligned diagnostic questions for courses that lack pre-seeded questions.
 * Leverages OpenAI API when configured for rich, context-aware technical questions,
 * and seamlessly falls back to deterministic curriculum templates if OpenAI is unconfigured or offline.
 * Persists validated questions to the database so they can be reused across application restarts.
 */
@Service
public class CourseQuestionGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(CourseQuestionGeneratorService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AssessmentQuestionRepository questionRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final OpenAiQuestionGeneratorService openAiQuestionGeneratorService;

    public CourseQuestionGeneratorService(
            AssessmentQuestionRepository questionRepository,
            CourseSkillRepository courseSkillRepository,
            OpenAiQuestionGeneratorService openAiQuestionGeneratorService) {
        this.questionRepository = questionRepository;
        this.courseSkillRepository = courseSkillRepository;
        this.openAiQuestionGeneratorService = openAiQuestionGeneratorService;
    }

    /**
     * Generates a validated question bank for a course (default 5 questions) and associates them with the given assessment.
     */
    /**
     * Generates a validated question bank for a course (default 5 questions) and associates them with the given assessment.
     */
    @Transactional
    public List<AssessmentQuestion> generateAndSaveQuestionsForCourse(Course course, Assessment assessment) {
        return generateAndSaveQuestionsForCourse(course, assessment, 5, Collections.emptySet());
    }

    /**
     * Generates a validated question bank with requested question count for a course.
     */
    @Transactional
    public List<AssessmentQuestion> generateAndSaveQuestionsForCourse(Course course, Assessment assessment, int count) {
        return generateAndSaveQuestionsForCourse(course, assessment, count, Collections.emptySet());
    }

    /**
     * Generates a validated question bank with requested question count for a course,
     * strictly avoiding repeating any existing questions or topics.
     */
    @Transactional
    public List<AssessmentQuestion> generateAndSaveQuestionsForCourse(
            Course course,
            Assessment assessment,
            int count,
            Set<String> existingQuestionsToAvoid) {

        log.info("Generating dynamic diagnostic questions for courseId={} title='{}' count={} (avoiding {} existing questions)",
                course.getId(), course.getTitle(), count, existingQuestionsToAvoid != null ? existingQuestionsToAvoid.size() : 0);

        List<CourseSkill> skills = courseSkillRepository.findByCourseId(course.getId());
        String primarySkill = !skills.isEmpty() ? skills.get(0).getSkill().getName() : "Software Engineering";

        Set<String> allToAvoid = new HashSet<>();
        if (existingQuestionsToAvoid != null) {
            for (String q : existingQuestionsToAvoid) {
                if (q != null && !q.trim().isEmpty()) {
                    allToAvoid.add(q.trim());
                }
            }
        }
        // Collect question texts already in the database for this course
        List<AssessmentQuestion> currentDbQuestions = questionRepository.findByCourseIdOrderByIdAsc(course.getId());
        for (AssessmentQuestion eq : currentDbQuestions) {
            if (eq.getQuestionText() != null && !eq.getQuestionText().trim().isEmpty()) {
                allToAvoid.add(eq.getQuestionText().trim());
            }
        }

        List<GeneratedQuestionSpec> specs = new ArrayList<>();

        // 1. Attempt OpenAI generation if integration is active
        if (openAiQuestionGeneratorService.isAvailable()) {
            try {
                specs = openAiQuestionGeneratorService.generateQuestions(course, primarySkill, count, allToAvoid);
                if (!specs.isEmpty()) {
                    log.info("Successfully received {} verified questions from OpenAI for courseId={}", specs.size(), course.getId());
                }
            } catch (Exception e) {
                log.warn("OpenAI question generation encountered an error: {}. Falling back to deterministic curriculum templates.", e.getMessage());
            }
        }

        // 2. Seamlessly fall back to deterministic curriculum templates if OpenAI produced no specs
        if (specs.isEmpty()) {
            log.info("Using deterministic curriculum template questions for courseId={}", course.getId());
            specs = buildQuestionSpecsForCourse(course, primarySkill, allToAvoid);
        }

        List<AssessmentQuestion> generatedQuestions = new ArrayList<>();

        for (GeneratedQuestionSpec spec : specs) {
            String trimmedText = spec.getQuestionText() != null ? spec.getQuestionText().trim() : "";
            if (isValidQuestionSpec(spec) && !allToAvoid.contains(trimmedText)) {
                try {
                    String optionsJson = MAPPER.writeValueAsString(spec.getOptions());
                    AssessmentQuestion q = new AssessmentQuestion();
                    q.setAssessment(assessment);
                    q.setCourse(course);
                    q.setQuestionText(spec.getQuestionText());
                    q.setOptionsJson(optionsJson);
                    q.setCorrectOptionIndex(spec.getCorrectOptionIndex());
                    q.setDifficultyLevel(spec.getDifficultyLevel());
                    q.setTopic(spec.getTopic());
                    q.setExplanation(spec.getExplanation());
                    q.setEstimatedTimeSeconds(spec.getEstimatedTimeSeconds());
                    generatedQuestions.add(q);
                    allToAvoid.add(trimmedText);
                } catch (Exception e) {
                    log.error("Failed to serialize options for generated question: {}", spec.getQuestionText(), e);
                }
            } else {
                log.warn("Skipping generated question (invalid or duplicate): {}", spec.getQuestionText());
            }
        }

        if (!generatedQuestions.isEmpty()) {
            List<AssessmentQuestion> saved = questionRepository.saveAll(generatedQuestions);
            log.info("Successfully generated and persisted {} brand new questions for courseId={}", saved.size(), course.getId());
            return saved;
        }

        log.warn("Fallback: No dynamic questions could be validated for courseId={}", course.getId());
        return Collections.emptyList();
    }

    private boolean isValidQuestionSpec(GeneratedQuestionSpec spec) {
        if (spec == null || spec.getQuestionText() == null || spec.getQuestionText().trim().length() < 15) {
            return false;
        }
        if (spec.getOptions() == null || spec.getOptions().size() < 4) {
            return false;
        }
        // Ensure options are non-empty and unique
        Set<String> uniqueOptions = new HashSet<>();
        for (String opt : spec.getOptions()) {
            if (opt == null || opt.trim().isEmpty() || !uniqueOptions.add(opt.trim())) {
                return false;
            }
        }
        if (spec.getCorrectOptionIndex() == null || spec.getCorrectOptionIndex() < 0 || spec.getCorrectOptionIndex() >= spec.getOptions().size()) {
            return false;
        }
        if (spec.getExplanation() == null || spec.getExplanation().trim().isEmpty()) {
            return false;
        }
        return true;
    }

    private List<GeneratedQuestionSpec> buildQuestionSpecsForCourse(Course course, String primarySkill, Set<String> existingQuestionsToAvoid) {
        String title = course.getTitle();

        List<List<GeneratedQuestionSpec>> batches = new ArrayList<>();

        // -------------------------------------------------------------
        // BATCH 1: Core Foundations, Resilience & Observability
        // -------------------------------------------------------------
        List<GeneratedQuestionSpec> b1 = new ArrayList<>();
        b1.add(new GeneratedQuestionSpec(
                String.format("What foundational architectural concept or primary objective forms the basis of '%s'?", title),
                List.of(
                        String.format("Applying robust enterprise design patterns and foundational best practices for %s", primarySkill),
                        "Minimizing standardized source code style rules",
                        "Replacing all database structures with flat unindexed text files",
                        "Executing all tasks synchronously in a single blocking thread"
                ),
                0,
                1,
                "Foundational Concepts",
                String.format("In modern software engineering, '%s' focuses on production resilience, structured architecture, and mastering foundational %s mechanics.", title, primarySkill),
                60
        ));
        b1.add(new GeneratedQuestionSpec(
                String.format("When developing production services covering '%s', how are unexpected runtime exceptions best handled?", title),
                List.of(
                        "Silently suppressing all runtime exceptions",
                        "Throwing raw unchecked stack traces directly to end users without logging",
                        "Implementing structured exception translation, idempotent retries, and comprehensive audit telemetry",
                        "Restarting the operating system host on every failed transaction"
                ),
                2,
                2,
                "Error Handling & Resilience",
                "Robust architectures rely on explicit exception translation, safe graceful degradation, and clear telemetry.",
                60
        ));
        b1.add(new GeneratedQuestionSpec(
                String.format("In high-throughput workflows covering '%s', how should concurrent operations and shared state be managed?", title),
                List.of(
                        "Disabling connection pooling entirely",
                        "Utilizing non-blocking I/O, fine-grained locking, or optimistic concurrency control",
                        "Serializing all transactions through a single static thread lock",
                        "Storing shared mutable state in unmanaged global variables"
                ),
                1,
                2,
                "Concurrency & State Management",
                "Non-blocking architectures and optimistic locking prevent bottlenecking under heavy concurrent workloads.",
                75
        ));
        b1.add(new GeneratedQuestionSpec(
                String.format("In mission-critical enterprise systems deployed for '%s', which architectural design pattern best mitigates downstream cascading failures?", title),
                List.of(
                        "Unbounded synchronous in-memory request queues without backpressure",
                        "Distributed Circuit Breakers paired with bounded thread isolation and fallback caches",
                        "Blind retry loops with zero exponential backoff or jitter",
                        "Hardcoding all downstream service IP addresses directly in client bundles"
                ),
                1,
                3,
                "High-Scale Architecture & Fault Tolerance",
                "Circuit breakers fail fast when downstream dependencies degrade, preventing thread starvation and cascading system crashes.",
                75
        ));
        b1.add(new GeneratedQuestionSpec(
                String.format("Which observability metric provides the highest-fidelity diagnostic signal for tail latency regressions in '%s'?", title),
                List.of(
                        "Arithmetic mean latency across all requests",
                        "P95 and P99 response latency percentiles correlated with thread pool saturation and GC pause times",
                        "Total count of git commits pushed to the main repository branch",
                        "Compiler optimization flag levels"
                ),
                1,
                3,
                "Observability & Performance Profiling",
                "Percentile metrics (P95/P99) combined with thread pool diagnostics expose long-tail latency degradation that mean averages completely conceal.",
                60
        ));
        batches.add(b1);

        // -------------------------------------------------------------
        // BATCH 2: Configuration, Distributed Caching & Distributed Transactions
        // -------------------------------------------------------------
        List<GeneratedQuestionSpec> b2 = new ArrayList<>();
        b2.add(new GeneratedQuestionSpec(
                String.format("In '%s', what is the recommended practice for externalizing environment-specific configurations across staging and production?", title),
                List.of(
                        "Hardcoding credentials directly into source control repositories",
                        "Utilizing layered environment profiles, secret managers, and strongly-typed configuration bindings",
                        "Editing compiled binary artifacts directly in the deployment runtime",
                        "Storing all production passwords in unencrypted plain text local files"
                ),
                1,
                1,
                "Configuration Management",
                "Externalizing configuration through environment profiles and secret managers ensures separation of concerns and production security.",
                60
        ));
        b2.add(new GeneratedQuestionSpec(
                String.format("When implementing distributed caching for '%s', how should cache stampede (thundering herd) be prevented?", title),
                List.of(
                        "Flushing all cache keys at midnight automatically",
                        "Employing probabilistic early expiration, mutex locking around cache misses, or background refresh",
                        "Disabling cache TTL and never expiring keys",
                        "Increasing client HTTP request timeouts to infinite"
                ),
                1,
                2,
                "Distributed Caching",
                "Mutex locking or probabilistic early recomputation prevents multiple concurrent threads from swamping the database when a key expires.",
                60
        ));
        b2.add(new GeneratedQuestionSpec(
                String.format("How should input validation and authentication sanitization be enforced in '%s' services?", title),
                List.of(
                        "Relying entirely on client-side frontend browser validation",
                        "Validating at service boundaries using strict schema annotations, parameter type binding, and stateless token verification",
                        "Skipping validation for internal intranet traffic",
                        "Executing raw unsanitized user strings directly into query buffers"
                ),
                1,
                2,
                "Security & Validation",
                "Defense-in-depth requires rigorous server-side boundary validation and token verification regardless of client-side checks.",
                60
        ));
        b2.add(new GeneratedQuestionSpec(
                String.format("In microservice architectures covering '%s', how is distributed data consistency achieved across decoupled databases without 2PC locking?", title),
                List.of(
                        "Executing distributed queries using shared global database locks",
                        "Implementing the Saga pattern with choreography/orchestration and compensating transactions",
                        "Ignoring inconsistent states as acceptable non-critical anomalies",
                        "Restricting all microservices to read from a single monolithic flat table"
                ),
                1,
                3,
                "Distributed Transactions",
                "The Saga pattern provides eventual consistency through a sequence of local transactions with automated compensating rollbacks.",
                75
        ));
        b2.add(new GeneratedQuestionSpec(
                String.format("When diagnosing high memory consumption and JVM OutOfMemoryErrors in '%s', what diagnostic technique is most effective?", title),
                List.of(
                        "Simply restarting the container every 10 minutes",
                        "Analyzing heap dumps with memory analyzer tooling to inspect object dominator trees and GC root retention paths",
                        "Doubling the CPU cores allocated to the virtual machine",
                        "Disabling garbage collection entirely with flags"
                ),
                1,
                3,
                "Memory & Performance Profiling",
                "Heap dump dominator trees identify which objects and reference chains prevent memory reclamation by the garbage collector.",
                75
        ));
        batches.add(b2);

        // -------------------------------------------------------------
        // BATCH 3: Dependency Injection, Messaging & Distributed Concurrency
        // -------------------------------------------------------------
        List<GeneratedQuestionSpec> b3 = new ArrayList<>();
        b3.add(new GeneratedQuestionSpec(
                String.format("What is the primary benefit of Dependency Injection and Inversion of Control in '%s'?", title),
                List.of(
                        "Decoupling component implementations to enhance testability, maintainability, and loose coupling",
                        "Eliminating the need to write unit or integration tests",
                        "Forcing all objects to be global singletons in memory",
                        "Speeding up compiler compilation times by 50%%"
                ),
                0,
                1,
                "Dependency Injection & Architecture",
                "Dependency Injection separates component creation from execution, enabling easy substitution of test doubles and modular design.",
                60
        ));
        b3.add(new GeneratedQuestionSpec(
                String.format("When handling asynchronous message consumption in '%s', how should message deduplication (idempotency) be guaranteed?", title),
                List.of(
                        "Assuming message brokers deliver each message strictly once under all network failure conditions",
                        "Maintaining an idempotent message ledger or transactional outbox with unique message keys",
                        "Deleting consumer queues when an error occurs",
                        "Executing duplicate messages without verification"
                ),
                1,
                2,
                "Event-Driven Messaging",
                "Because distributed messaging guarantees at-least-once delivery, consumers must track message IDs to avoid processing duplicates.",
                60
        ));
        b3.add(new GeneratedQuestionSpec(
                String.format("How does database connection pool exhaustion manifest in production '%s' applications?", title),
                List.of(
                        "Immediate instantaneous CPU utilization drop to 0%%",
                        "Thread starvation, request timeout spikes, and threads blocking on getConnection() calls",
                        "Automatic generation of additional database tables",
                        "Operating system network interface disconnections"
                ),
                1,
                2,
                "Database Resource Management",
                "When connection pools are exhausted or leaked, worker threads block waiting for connections until timeouts cascade across the system.",
                60
        ));
        b3.add(new GeneratedQuestionSpec(
                String.format("When coordinating distributed locks across nodes in '%s', why is a simple Redis key with TTL insufficient without fencing tokens?", title),
                List.of(
                        "Redis cannot store keys with time-to-live expiration",
                        "A long GC pause on a lock holder can expire the lease, allowing another node to acquire the lock and cause split-brain mutations",
                        "Redis keys cannot be read over network connections",
                        "Distributed locks can only be implemented using relational databases"
                ),
                1,
                3,
                "Distributed Locking & Concurrency",
                "GC pauses or network delays can outlive TTLs; fencing tokens (monotonic counters) allow downstream storage to reject outdated lock holders.",
                75
        ));
        b3.add(new GeneratedQuestionSpec(
                String.format("In distributed tracing for '%s', how is context propagated across asynchronous network hops and threads?", title),
                List.of(
                        "Writing trace IDs into temporary disk log files",
                        "Injecting and extracting W3C TraceContext headers (traceparent/tracestate) across HTTP and messaging boundaries",
                        "Using IP address geocoding lookups",
                        "Relying on operating system process PID matching"
                ),
                1,
                3,
                "Distributed Observability",
                "Standardized W3C TraceContext headers correlate parent-child spans across independent microservices and network hops.",
                75
        ));
        batches.add(b3);

        // -------------------------------------------------------------
        // BATCH 4: API Contracts, Rate Limiting, Reactive Backpressure & Sharding
        // -------------------------------------------------------------
        List<GeneratedQuestionSpec> b4 = new ArrayList<>();
        b4.add(new GeneratedQuestionSpec(
                String.format("Which HTTP status code correctly communicates that an incoming request in '%s' exceeded API rate limits?", title),
                List.of(
                        "404 Not Found",
                        "429 Too Many Requests",
                        "500 Internal Server Error",
                        "204 No Content"
                ),
                1,
                1,
                "API Contracts & Standards",
                "HTTP 429 Too Many Requests informs the client that rate limits were breached, often accompanied by a Retry-After header.",
                45
        ));
        b4.add(new GeneratedQuestionSpec(
                String.format("Which rate-limiting algorithm allows for temporary traffic bursts while enforcing a steady average throughput in '%s'?", title),
                List.of(
                        "Fixed Window Counter",
                        "Token Bucket Algorithm",
                        "Random Drop Algorithm",
                        "Round Robin Allocation"
                ),
                1,
                2,
                "Traffic Control & Rate Limiting",
                "The Token Bucket algorithm accumulates tokens up to bucket capacity, smoothly allowing bursty traffic up to bucket size.",
                60
        ));
        b4.add(new GeneratedQuestionSpec(
                String.format("In reactive or asynchronous event processing for '%s', what problem does Reactive Streams 'backpressure' solve?", title),
                List.of(
                        "Encrypting data buffers in memory",
                        "Allowing slow consumers to signal available capacity so fast producers do not overwhelm memory buffers",
                        "Compressing JSON payloads across network sockets",
                        "Automating database index re-indexing"
                ),
                1,
                2,
                "Reactive Backpressure",
                "Backpressure allows consumers to pull data on demand, preventing producer throughput from triggering out-of-memory errors.",
                60
        ));
        b4.add(new GeneratedQuestionSpec(
                String.format("When partitioning or sharding database tables for '%s', what is the biggest trade-off of cross-shard scatter-gather queries?", title),
                List.of(
                        "Zero disk storage consumption",
                        "High query latency caused by querying every shard and merging results in application memory",
                        "Automatic prevention of all deadlocks",
                        "Elimination of foreign key relationships entirely"
                ),
                1,
                3,
                "Database Partitioning & Sharding",
                "Scatter-gather queries must contact all shards, bounded by the slowest shard and incurring heavy network and sorting overhead.",
                75
        ));
        b4.add(new GeneratedQuestionSpec(
                String.format("In blue-green zero-downtime deployments for '%s', how must database schema changes be orchestrated to avoid breaking running versions?", title),
                List.of(
                        "Dropping deprecated columns immediately prior to deploying new code",
                        "Using the Expand and Contract pattern (adding nullable/new columns first, deploying new code, then migrating data and dropping)",
                        "Locking the entire database in exclusive mode during traffic switches",
                        "Restarting the database cluster from empty backups"
                ),
                1,
                3,
                "Zero-Downtime Deployment",
                "The Expand and Contract pattern maintains backward compatibility so both older and newer application versions operate seamlessly.",
                75
        ));
        batches.add(b4);

        // -------------------------------------------------------------
        // BATCH 5: Automated Testing, Security mTLS, Batching & Event Sourcing
        // -------------------------------------------------------------
        List<GeneratedQuestionSpec> b5 = new ArrayList<>();
        b5.add(new GeneratedQuestionSpec(
                String.format("In testing architectures for '%s', what distinguishes unit tests from integration tests?", title),
                List.of(
                        "Unit tests isolate single units in memory with mocks, while integration tests verify collaboration across real components or databases",
                        "Unit tests require real live production database servers",
                        "Integration tests can only be run manually in browser windows",
                        "Unit tests must take over 30 minutes to complete"
                ),
                0,
                1,
                "Automated Testing Strategies",
                "Unit tests test business logic in fast isolation, while integration tests validate wiring and external integration contracts.",
                45
        ));
        b5.add(new GeneratedQuestionSpec(
                String.format("How does Mutual TLS (mTLS) enhance service-to-service communication security in '%s'?", title),
                List.of(
                        "It replaces all passwords with email verification",
                        "Both client and server authenticate each other's cryptographic certificates, preventing impersonation and eavesdropping",
                        "It eliminates network firewalls entirely",
                        "It disables SSL encryption for faster performance"
                ),
                1,
                2,
                "Network Security & mTLS",
                "mTLS provides bidirectional cryptographic authentication and encryption between microservices in zero-trust architectures.",
                60
        ));
        b5.add(new GeneratedQuestionSpec(
                String.format("When executing high-volume batch migrations in '%s', why is chunk-oriented processing with periodic commits preferred?", title),
                List.of(
                        "It maximizes single-transaction memory consumption",
                        "It keeps database undo/redo logs and memory bounded, preventing rollback crashes on large datasets",
                        "It avoids logging errors completely",
                        "It forces single-threaded execution"
                ),
                1,
                2,
                "Batch Processing & Chunking",
                "Chunking bounds memory and transaction log growth, ensuring progress is saved incrementally without memory exhaustion.",
                60
        ));
        b5.add(new GeneratedQuestionSpec(
                String.format("In Event Sourcing architectures for '%s', how is current state derived and query latency minimized?", title),
                List.of(
                        "Recalculating all historical events from genesis on every single read query",
                        "Maintaining pre-computed CQRS read projections (snapshots/views) updated asynchronously or synchronously upon event emission",
                        "Deleting past events once a new event arrives",
                        "Storing only the latest state and discarding all domain events"
                ),
                1,
                3,
                "Event Sourcing & Projections",
                "Read projections pre-aggregate domain events into denormalized read-optimized tables, giving sub-millisecond query response times.",
                75
        ));
        b5.add(new GeneratedQuestionSpec(
                String.format("Which Linux kernel socket or network configuration optimizes high-throughput low-latency network I/O for '%s' servers?", title),
                List.of(
                        "Reducing TCP socket buffers to 1 kilobyte",
                        "Tuning TCP keepalive, socket receive/send buffers (SO_RCVBUF/SO_SNDBUF), and epoll worker connection limits",
                        "Disabling TCP ACK packets",
                        "Using synchronous blocking thread-per-client sockets for all connections"
                ),
                1,
                3,
                "High-Throughput Networking",
                "Socket buffer tuning and non-blocking epoll event loops prevent TCP buffer saturation and enable handling tens of thousands of concurrent sockets.",
                75
        ));
        batches.add(b5);

        // Find the first batch where all 5 questions are NOT in existingQuestionsToAvoid
        for (List<GeneratedQuestionSpec> batch : batches) {
            boolean allNew = true;
            for (GeneratedQuestionSpec q : batch) {
                if (existingQuestionsToAvoid.contains(q.getQuestionText().trim())) {
                    allNew = false;
                    break;
                }
            }
            if (allNew) {
                return batch;
            }
        }

        // If all 5 predefined batches have some overlap, return the batch with the fewest overlaps,
        // or dynamically create a novel parameterized variant.
        int batchNumber = (existingQuestionsToAvoid.size() / 5) + 1;
        List<GeneratedQuestionSpec> dynamicBatch = new ArrayList<>();
        dynamicBatch.add(new GeneratedQuestionSpec(
                String.format("[Variant %d] What core principle underpins reliable component design in '%s'?", batchNumber, title),
                List.of(
                        String.format("Clear abstraction boundaries, automated verification, and high cohesion in %s", primarySkill),
                        "Tight bidirectional coupling between unrelated business modules",
                        "Storing application logs directly in CPU registers",
                        "Eliminating version control repositories"
                ),
                0,
                1,
                "Architecture Design Principles",
                "High cohesion and clear abstraction boundaries ensure maintainability as systems scale.",
                50
        ));
        dynamicBatch.add(new GeneratedQuestionSpec(
                String.format("[Variant %d] In '%s', how should transient network timeouts to upstream dependencies be handled?", batchNumber, title),
                List.of(
                        "Crashing the application thread immediately",
                        "Applying exponential backoff with randomized jitter to prevent thundering herd retries",
                        "Infinite synchronous retry loops with zero delays",
                        "Ignoring upstream timeout errors completely"
                ),
                1,
                2,
                "Resilience & Retries",
                "Exponential backoff with jitter prevents retrying clients from synchronizing and overwhelming recovering services.",
                60
        ));
        dynamicBatch.add(new GeneratedQuestionSpec(
                String.format("[Variant %d] How does optimistic locking protect concurrent data modifications in '%s'?", batchNumber, title),
                List.of(
                        "By locking the entire database table for all users",
                        "By checking a version number or timestamp before updating and aborting if modified by another transaction",
                        "By disabling ACID transaction guarantees",
                        "By discarding newer writes in favor of older stale writes"
                ),
                1,
                2,
                "Concurrency & Locking",
                "Optimistic locking prevents lost updates in concurrent workflows without the throughput penalty of pessimistic database locks.",
                60
        ));
        dynamicBatch.add(new GeneratedQuestionSpec(
                String.format("[Variant %d] When designing for high availability in '%s', which mechanism prevents split-brain scenarios during network partitions?", batchNumber, title),
                List.of(
                        "Allowing all isolated partitions to independently accept writes",
                        "Requiring quorum (majority vote: N/2 + 1 nodes) before accepting state mutations or leader election",
                        "Shutting down the entire network when a single node disconnects",
                        "Using random node election without heartbeats"
                ),
                1,
                3,
                "High Availability & Consensus",
                "Quorum consensus ensures only the partition holding a strict majority can commit state changes, preventing conflicting split-brain states.",
                75
        ));
        dynamicBatch.add(new GeneratedQuestionSpec(
                String.format("[Variant %d] In mission-critical deployments of '%s', what diagnostic strategy best identifies CPU throttling in containerized environments?", batchNumber, title),
                List.of(
                        "Monitoring CPU CFS (Completely Fair Scheduler) throttle metrics and container run queue latency",
                        "Checking git repository branch commit history",
                        "Recompiling source code in debug mode",
                        "Increasing host screen resolution"
                ),
                0,
                3,
                "Container Performance & Kernel Profiling",
                "Linux CFS quota metrics reveal when container CPU limits cause involuntary thread throttling despite idle host capacity.",
                75
        ));

        return dynamicBatch;
    }
}
