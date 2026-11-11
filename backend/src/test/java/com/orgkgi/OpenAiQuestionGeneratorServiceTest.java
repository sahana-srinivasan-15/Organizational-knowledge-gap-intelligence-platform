package com.orgkgi;

import com.orgkgi.config.OpenAiConfig;
import com.orgkgi.dto.assessment.GeneratedQuestionSpec;
import com.orgkgi.entity.Assessment;
import com.orgkgi.entity.AssessmentQuestion;
import com.orgkgi.entity.Course;
import com.orgkgi.entity.CourseSkill;
import com.orgkgi.repository.AssessmentQuestionRepository;
import com.orgkgi.repository.CourseSkillRepository;
import com.orgkgi.service.CourseQuestionGeneratorService;
import com.orgkgi.service.OpenAiQuestionGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;

public class OpenAiQuestionGeneratorServiceTest {

    private OpenAiConfig openAiConfig;
    private OpenAiQuestionGeneratorService openAiService;

    @BeforeEach
    void setUp() {
        openAiConfig = new OpenAiConfig();
        openAiService = new OpenAiQuestionGeneratorService(openAiConfig, null);
    }

    @Test
    void testIsAvailableReflectsConfiguration() {
        ReflectionTestUtils.setField(openAiConfig, "apiKey", "");
        ReflectionTestUtils.setField(openAiConfig, "enabled", true);
        assertFalse(openAiService.isAvailable());

        ReflectionTestUtils.setField(openAiConfig, "apiKey", "sk-test-key-12345");
        ReflectionTestUtils.setField(openAiConfig, "enabled", false);
        assertFalse(openAiService.isAvailable());

        ReflectionTestUtils.setField(openAiConfig, "apiKey", "placeholder");
        ReflectionTestUtils.setField(openAiConfig, "enabled", true);
        assertFalse(openAiService.isAvailable());

        ReflectionTestUtils.setField(openAiConfig, "apiKey", "sk-test-key-12345");
        ReflectionTestUtils.setField(openAiConfig, "enabled", true);
        assertTrue(openAiService.isAvailable());
    }

    @Test
    void testParseAndValidateQuestionsWithValidPayload() {
        String mockResponse = """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "{\\"questions\\": [{\\"questionText\\": \\"How does the Circuit Breaker pattern prevent cascading system failures in distributed services?\\", \\"options\\": [\\"Trips open on failure threshold\\", \\"Doubles request rate\\", \\"Kills database connections\\", \\"Ignores timeouts\\"], \\"correctOptionIndex\\": 0, \\"difficultyLevel\\": 2, \\"topic\\": \\"Resilience Patterns\\", \\"explanation\\": \\"Circuit breakers stop calling faulty services.\\", \\"estimatedTimeSeconds\\": 60}]}"
                      }
                    }
                  ]
                }
                """;

        List<GeneratedQuestionSpec> specs = openAiService.parseAndValidateQuestions(mockResponse, 2, "Distributed Systems");
        assertEquals(1, specs.size());
        assertEquals("How does the Circuit Breaker pattern prevent cascading system failures in distributed services?", specs.get(0).getQuestionText());
        assertEquals(4, specs.get(0).getOptions().size());
        assertEquals(0, specs.get(0).getCorrectOptionIndex());
        assertEquals("Resilience Patterns", specs.get(0).getTopic());
    }

    @Test
    void testParseAndValidateDiscardsMalformedAndInvalidQuestions() {
        String malformedResponse = """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "{\\"questions\\": [
                          {\\"questionText\\": \\"Too short\\", \\"options\\": [\\"A\\", \\"B\\", \\"C\\", \\"D\\"], \\"correctOptionIndex\\": 0},
                          {\\"questionText\\": \\"Valid length question text here for testing options count\\", \\"options\\": [\\"A\\", \\"B\\"], \\"correctOptionIndex\\": 0},
                          {\\"questionText\\": \\"Valid length question text here with duplicate option values\\", \\"options\\": [\\"Same\\", \\"Same\\", \\"B\\", \\"C\\"], \\"correctOptionIndex\\": 0},
                          {\\"questionText\\": \\"Valid question text with out of bounds correct index\\", \\"options\\": [\\"A\\", \\"B\\", \\"C\\", \\"D\\"], \\"correctOptionIndex\\": 9}
                        ]}"
                      }
                    }
                  ]
                }
                """;

        List<GeneratedQuestionSpec> specs = openAiService.parseAndValidateQuestions(malformedResponse, 2, "General");
        assertTrue(specs.isEmpty(), "All malformed questions should be rejected by validation logic");
    }

    @Test
    void testParseAndValidateEnforcesRequiredDifficultyDistributionForFiveQuestions() {
        String mockContent = "{\"questions\": ["
                + "{\"questionText\": \"Question 1 testing core foundational concepts\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctOptionIndex\": 0},"
                + "{\"questionText\": \"Question 2 testing error resilience strategies\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctOptionIndex\": 1},"
                + "{\"questionText\": \"Question 3 testing concurrent state access models\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctOptionIndex\": 2},"
                + "{\"questionText\": \"Question 4 testing high-scale distributed architecture\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctOptionIndex\": 3},"
                + "{\"questionText\": \"Question 5 testing performance profiling and tail latency\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctOptionIndex\": 0}"
                + "]}";

        List<GeneratedQuestionSpec> specs = openAiService.parseAndValidateQuestions(mockContent, 2, "Course Domain");
        assertEquals(5, specs.size());
        assertEquals(1, specs.get(0).getDifficultyLevel(), "Question 1 must be Level 1 (Easy)");
        assertEquals(2, specs.get(1).getDifficultyLevel(), "Question 2 must be Level 2 (Medium)");
        assertEquals(2, specs.get(2).getDifficultyLevel(), "Question 3 must be Level 2 (Medium)");
        assertEquals(3, specs.get(3).getDifficultyLevel(), "Question 4 must be Level 3 (Hard)");
        assertEquals(3, specs.get(4).getDifficultyLevel(), "Question 5 must be Level 3 (Hard)");
    }

    @Test
    void testCourseQuestionGeneratorFallsBackWhenOpenAiUnavailable() {
        StubQuestionRepository stubQuestionRepo = new StubQuestionRepository();
        StubCourseSkillRepository stubSkillRepo = new StubCourseSkillRepository();
        FakeOpenAiService fakeOpenAi = new FakeOpenAiService(false, Collections.emptyList());

        CourseQuestionGeneratorService generator = new CourseQuestionGeneratorService(
                stubQuestionRepo, stubSkillRepo, fakeOpenAi);

        Course course = new Course();
        course.setId(99L);
        course.setTitle("Cloud Native Microservices");
        course.setDifficultyLevel("INTERMEDIATE");

        Assessment assessment = new Assessment();
        assessment.setId(50L);

        List<AssessmentQuestion> generated = generator.generateAndSaveQuestionsForCourse(course, assessment, 5);
        assertNotNull(generated);
        assertEquals(5, generated.size(), "Should fall back to the 5 deterministic curriculum questions");
        assertTrue(generated.get(0).getQuestionText().contains("Cloud Native Microservices"));
        assertEquals(5, stubQuestionRepo.savedQuestions.size());
    }

    @Test
    void testCourseQuestionGeneratorUsesOpenAiWhenAvailableAndReturnsValidSpecs() {
        StubQuestionRepository stubQuestionRepo = new StubQuestionRepository();
        StubCourseSkillRepository stubSkillRepo = new StubCourseSkillRepository();

        List<GeneratedQuestionSpec> openAiSpecs = List.of(
                new GeneratedQuestionSpec(
                        "What is the function of the Event Sourcing pattern in event-driven systems?",
                        List.of("Captures state changes as append-only log", "Deletes old database records", "Synchronizes CPU caches", "Replaces DNS records"),
                        0, 3, "Event Architecture", "Event sourcing captures state mutations as immutable sequences.", 60
                )
        );
        FakeOpenAiService fakeOpenAi = new FakeOpenAiService(true, openAiSpecs);

        CourseQuestionGeneratorService generator = new CourseQuestionGeneratorService(
                stubQuestionRepo, stubSkillRepo, fakeOpenAi);

        Course course = new Course();
        course.setId(99L);
        course.setTitle("Advanced Event Driven Systems");
        course.setDifficultyLevel("ADVANCED");

        Assessment assessment = new Assessment();
        assessment.setId(50L);

        List<AssessmentQuestion> generated = generator.generateAndSaveQuestionsForCourse(course, assessment, 5);
        assertNotNull(generated);
        assertEquals(1, generated.size());
        assertEquals("What is the function of the Event Sourcing pattern in event-driven systems?", generated.get(0).getQuestionText());
        assertEquals("Event Architecture", generated.get(0).getTopic());
        assertEquals(1, stubQuestionRepo.savedQuestions.size());
    }

    private static class FakeOpenAiService extends OpenAiQuestionGeneratorService {
        private final boolean available;
        private final List<GeneratedQuestionSpec> specs;

        public FakeOpenAiService(boolean available, List<GeneratedQuestionSpec> specs) {
            super(new OpenAiConfig(), null);
            this.available = available;
            this.specs = specs;
        }

        @Override
        public boolean isAvailable() {
            return available;
        }

        @Override
        public List<GeneratedQuestionSpec> generateQuestions(Course course, String primarySkill, int count) {
            return specs;
        }

        @Override
        public List<GeneratedQuestionSpec> generateQuestions(Course course, String primarySkill, int count, Set<String> existingQuestionsToAvoid) {
            return specs;
        }
    }

    private static class StubQuestionRepository implements AssessmentQuestionRepository {
        public final List<AssessmentQuestion> savedQuestions = new ArrayList<>();

        @Override
        public <S extends AssessmentQuestion> List<S> saveAll(Iterable<S> entities) {
            List<S> list = new ArrayList<>();
            for (S entity : entities) {
                list.add(entity);
                savedQuestions.add(entity);
            }
            return list;
        }

        @Override public List<AssessmentQuestion> findByAssessmentIdOrderByIdAsc(Long assessmentId) { return Collections.emptyList(); }
        @Override public List<AssessmentQuestion> findByCourseIdOrderByIdAsc(Long courseId) { return Collections.emptyList(); }
        @Override public List<AssessmentQuestion> findByAssessmentIdOrCourseIdOrderByIdAsc(Long assessmentId, Long courseId) { return Collections.emptyList(); }
        @Override public long countByAssessmentId(Long assessmentId) { return 0; }
        @Override public long countByCourseId(Long courseId) { return 0; }

        @Override public void flush() {}
        @Override public <S extends AssessmentQuestion> S saveAndFlush(S entity) { return entity; }
        @Override public <S extends AssessmentQuestion> List<S> saveAllAndFlush(Iterable<S> entities) { return Collections.emptyList(); }
        @Override public void deleteAllInBatch(Iterable<AssessmentQuestion> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public AssessmentQuestion getOne(Long aLong) { return null; }
        @Override public AssessmentQuestion getById(Long aLong) { return null; }
        @Override public AssessmentQuestion getReferenceById(Long aLong) { return null; }
        @Override public <S extends AssessmentQuestion> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends AssessmentQuestion> List<S> findAll(Example<S> example) { return Collections.emptyList(); }
        @Override public <S extends AssessmentQuestion> List<S> findAll(Example<S> example, Sort sort) { return Collections.emptyList(); }
        @Override public <S extends AssessmentQuestion> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends AssessmentQuestion> long count(Example<S> example) { return 0; }
        @Override public <S extends AssessmentQuestion> boolean exists(Example<S> example) { return false; }
        @Override public <S extends AssessmentQuestion, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public <S extends AssessmentQuestion> S save(S entity) { savedQuestions.add(entity); return entity; }
        @Override public Optional<AssessmentQuestion> findById(Long aLong) { return Optional.empty(); }
        @Override public boolean existsById(Long aLong) { return false; }
        @Override public List<AssessmentQuestion> findAll() { return Collections.emptyList(); }
        @Override public List<AssessmentQuestion> findAllById(Iterable<Long> longs) { return Collections.emptyList(); }
        @Override public long count() { return savedQuestions.size(); }
        @Override public void deleteById(Long aLong) {}
        @Override public void delete(AssessmentQuestion entity) {}
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends AssessmentQuestion> entities) {}
        @Override public void deleteAll() {}
        @Override public List<AssessmentQuestion> findAll(Sort sort) { return Collections.emptyList(); }
        @Override public Page<AssessmentQuestion> findAll(Pageable pageable) { return null; }
    }

    private static class StubCourseSkillRepository implements CourseSkillRepository {
        @Override public List<CourseSkill> findByCourseId(Long courseId) { return Collections.emptyList(); }
        @Override public List<CourseSkill> findBySkillId(Long skillId) { return Collections.emptyList(); }
        @Override public List<CourseSkill> findAllWithCourseAndSkill() { return Collections.emptyList(); }
        @Override public void flush() {}
        @Override public <S extends CourseSkill> S saveAndFlush(S entity) { return entity; }
        @Override public <S extends CourseSkill> List<S> saveAllAndFlush(Iterable<S> entities) { return Collections.emptyList(); }
        @Override public void deleteAllInBatch(Iterable<CourseSkill> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public CourseSkill getOne(Long aLong) { return null; }
        @Override public CourseSkill getById(Long aLong) { return null; }
        @Override public CourseSkill getReferenceById(Long aLong) { return null; }
        @Override public <S extends CourseSkill> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends CourseSkill> List<S> findAll(Example<S> example) { return Collections.emptyList(); }
        @Override public <S extends CourseSkill> List<S> findAll(Example<S> example, Sort sort) { return Collections.emptyList(); }
        @Override public <S extends CourseSkill> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends CourseSkill> long count(Example<S> example) { return 0; }
        @Override public <S extends CourseSkill> boolean exists(Example<S> example) { return false; }
        @Override public <S extends CourseSkill, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public <S extends CourseSkill> S save(S entity) { return entity; }
        @Override public <S extends CourseSkill> List<S> saveAll(Iterable<S> entities) { return Collections.emptyList(); }
        @Override public Optional<CourseSkill> findById(Long aLong) { return Optional.empty(); }
        @Override public boolean existsById(Long aLong) { return false; }
        @Override public List<CourseSkill> findAll() { return Collections.emptyList(); }
        @Override public List<CourseSkill> findAllById(Iterable<Long> longs) { return Collections.emptyList(); }
        @Override public long count() { return 0; }
        @Override public void deleteById(Long aLong) {}
        @Override public void delete(CourseSkill entity) {}
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends CourseSkill> entities) {}
        @Override public void deleteAll() {}
        @Override public List<CourseSkill> findAll(Sort sort) { return Collections.emptyList(); }
        @Override public Page<CourseSkill> findAll(Pageable pageable) { return null; }
    }
}
