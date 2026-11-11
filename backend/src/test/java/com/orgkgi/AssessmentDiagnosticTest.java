package com.orgkgi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.assessment.AnswerSubmissionDto;
import com.orgkgi.dto.assessment.AssessmentSubmissionRequestDto;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.entity.EmployeeSkill;
import com.orgkgi.entity.VerificationStatus;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.EmployeeSkillRepository;
import com.orgkgi.security.JwtTokenProvider;
import com.jayway.jsonpath.JsonPath;
import com.orgkgi.entity.Assessment;
import com.orgkgi.entity.Course;
import com.orgkgi.repository.AssessmentRepository;
import com.orgkgi.repository.CourseRepository;
import com.orgkgi.repository.AssessmentAttemptRepository;
import com.orgkgi.service.AssessmentService;
import com.orgkgi.service.CourseQuestionGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AssessmentDiagnosticTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private CourseQuestionGeneratorService questionGeneratorService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private String employeeDavidToken;  // David Kim (Profile ID 2, User ID 4, Dept 1)
    private String managerEngToken;     // Sarah Jenkins (Manager of Dept 1)
    private String adminToken;          // Marcus Vance (Admin)

    @BeforeEach
    void setUp() {
        attemptRepository.deleteAll();
        jdbcTemplate.execute("DELETE FROM assessment_questions WHERE id > 100 OR (assessment_id = 1 AND id > 3)");
        employeeDavidToken = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
        managerEngToken = "Bearer " + tokenProvider.generateTokenFromUser(2L, "manager.eng@orgkgi.dev", "MANAGER");
        adminToken = "Bearer " + tokenProvider.generateTokenFromUser(1L, "admin@orgkgi.dev", "ADMIN");
    }

    @Test
    void testGetAllAssessmentsAndGetBySkill() throws Exception {
        mockMvc.perform(get("/api/v1/assessments")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));

        // Assessment for Spring Boot (Skill 2)
        mockMvc.perform(get("/api/v1/assessments/skill/2")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data[0].title", containsString("Spring Boot")))
                .andExpect(jsonPath("$.data[0].skillId", is(2)))
                .andExpect(jsonPath("$.data[0].questionCount", is(3)));
    }

    @Test
    void testFetchQuestionsSafelyNeverExposesCorrectAnswers() throws Exception {
        mockMvc.perform(get("/api/v1/assessments/1/questions")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(3)))
                // Verify question text, options, and difficulty are present
                .andExpect(jsonPath("$.data[0].questionText", notNullValue()))
                .andExpect(jsonPath("$.data[0].options", hasSize(4)))
                .andExpect(jsonPath("$.data[0].difficultyLevel", notNullValue()))
                // CRITICAL SECURITY ASSERTION: Correct answers/keys MUST NOT leak
                .andExpect(jsonPath("$.data[0].correctOptionIndex").doesNotExist())
                .andExpect(jsonPath("$.data[0].correctAnswer").doesNotExist())
                .andExpect(jsonPath("$.data[1].correctOptionIndex").doesNotExist())
                .andExpect(jsonPath("$.data[2].correctOptionIndex").doesNotExist());
    }

    @Test
    void testStartAssessmentAttemptReturnsWindowAndSafeQuestions() throws Exception {
        mockMvc.perform(post("/api/v1/assessments/1/start")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.assessmentId", is(1)))
                .andExpect(jsonPath("$.data.timeLimitMinutes", is(20)))
                .andExpect(jsonPath("$.data.startedAt", notNullValue()))
                .andExpect(jsonPath("$.data.expiresAt", notNullValue()))
                .andExpect(jsonPath("$.data.questions", hasSize(3)))
                .andExpect(jsonPath("$.data.questions[0].correctOptionIndex").doesNotExist());
    }

    @Test
    void testSubmitAssessmentPassingElevatesVerifiedProficiency() throws Exception {
        // Assessment 1 has questions 1, 2, 3 in seed data. All correct answers are at index 1.
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(5),
                List.of(
                        new AnswerSubmissionDto(1L, 1),
                        new AnswerSubmissionDto(2L, 1),
                        new AnswerSubmissionDto(3L, 1)
                )
        );

        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.passed", is(true)))
                .andExpect(jsonPath("$.data.score", is(100.0)))
                .andExpect(jsonPath("$.data.correctQuestions", is(3)))
                .andExpect(jsonPath("$.data.verificationStatus", is("ASSESSED")))
                .andExpect(jsonPath("$.data.verifiedProficiencyLevel", is(3)));

        // Verify database state: David Kim's Spring Boot skill is now ASSESSED at level 3
        EmployeeSkill es = employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 2L).orElseThrow();
        assertEquals(VerificationStatus.ASSESSED, es.getVerificationStatus());
        assertEquals(3, es.getVerifiedProficiencyLevel());
    }

    @Test
    void testSubmitAssessmentFailingDoesNotFalselyElevateSkill() throws Exception {
        // Submitting wrong answers for all questions
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(5),
                List.of(
                        new AnswerSubmissionDto(1L, 0), // wrong
                        new AnswerSubmissionDto(2L, 0), // wrong
                        new AnswerSubmissionDto(3L, 0)  // wrong
                )
        );

        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.passed", is(false)))
                .andExpect(jsonPath("$.data.score", is(0.0)))
                .andExpect(jsonPath("$.data.correctQuestions", is(0)))
                .andExpect(jsonPath("$.data.verificationStatus", is("SELF_REPORTED")))
                .andExpect(jsonPath("$.data.verifiedProficiencyLevel", is(1)));

        // Verify database state: skill proficiency was NOT elevated
        EmployeeSkill es = employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 2L).orElseThrow();
        assertEquals(VerificationStatus.SELF_REPORTED, es.getVerificationStatus());
        assertEquals(1, es.getVerifiedProficiencyLevel());
    }

    @Test
    void testPreservationOfHigherVerifiedProficiency() throws Exception {
        // Explicitly set David Kim's verified proficiency to Level 4 prior to test
        EmployeeSkill es = employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 2L).orElseThrow();
        es.setVerifiedProficiencyLevel(4);
        es.setVerificationStatus(VerificationStatus.MANAGER_VERIFIED);
        employeeSkillRepository.save(es);

        // Take level 3 assessment and pass with 100%
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(3),
                List.of(
                        new AnswerSubmissionDto(1L, 1),
                        new AnswerSubmissionDto(2L, 1),
                        new AnswerSubmissionDto(3L, 1)
                )
        );

        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.passed", is(true)))
                // Must preserve higher level 4!
                .andExpect(jsonPath("$.data.verifiedProficiencyLevel", is(4)));

        EmployeeSkill updated = employeeSkillRepository.findByEmployeeProfileIdAndSkillId(2L, 2L).orElseThrow();
        assertEquals(4, updated.getVerifiedProficiencyLevel(), "Higher verified proficiency level 4 must be preserved");
    }

    @Test
    void testSubmitInvalidOptionIndexThrowsBadRequest() throws Exception {
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(2),
                List.of(
                        new AnswerSubmissionDto(1L, 99) // Invalid option index
                )
        );

        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("out of range")));
    }

    @Test
    void testSubmitInvalidQuestionIdThrowsBadRequest() throws Exception {
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(2),
                List.of(
                        new AnswerSubmissionDto(9999L, 0) // Non-existent question
                )
        );

        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("does not belong to assessment")));
    }

    @Test
    void testSubmitDuplicateQuestionAnswersThrowsBadRequest() throws Exception {
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(2),
                List.of(
                        new AnswerSubmissionDto(1L, 1),
                        new AnswerSubmissionDto(1L, 2) // Duplicate answer for question 1
                )
        );

        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Duplicate answer")));
    }

    @Test
    void testExpiredAssessmentAttemptThrowsBadRequest() throws Exception {
        // Assessment 1 time limit is 20 minutes; starting 40 minutes ago exceeds time limit + grace
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(40),
                List.of(
                        new AnswerSubmissionDto(1L, 1),
                        new AnswerSubmissionDto(2L, 1),
                        new AnswerSubmissionDto(3L, 1)
                )
        );

        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("time limit exceeded")));
    }

    @Test
    void testAssessmentHistoryAndDepartmentAuthorization() throws Exception {
        // First submit an attempt so history is non-empty
        AssessmentSubmissionRequestDto request = new AssessmentSubmissionRequestDto(
                OffsetDateTime.now().minusMinutes(2),
                List.of(
                        new AnswerSubmissionDto(1L, 1),
                        new AnswerSubmissionDto(2L, 1),
                        new AnswerSubmissionDto(3L, 1)
                )
        );
        mockMvc.perform(post("/api/v1/assessments/1/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // 1. Employee David views own history
        mockMvc.perform(get("/api/v1/assessments/history/me")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // 2. Manager Sarah (Dept 1) views David's (Dept 1) history
        mockMvc.perform(get("/api/v1/assessments/history/employee/2")
                .header("Authorization", managerEngToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // 3. Manager Sarah (Dept 1) attempts to view Elena Rostova (Dept 2, Profile 3) -> 403 Forbidden
        mockMvc.perform(get("/api/v1/assessments/history/employee/3")
                .header("Authorization", managerEngToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testEligibleCoursesEndpointReturnsAllCoursesWithAssessmentReadiness() throws Exception {
        mockMvc.perform(get("/api/v1/assessments/courses")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                // Verify all courses in catalog are returned
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(15))))
                // Verify structure: courseId, title, difficulty, questionPoolSize
                .andExpect(jsonPath("$.data[0].courseId", notNullValue()))
                .andExpect(jsonPath("$.data[0].courseTitle", notNullValue()))
                .andExpect(jsonPath("$.data[0].questionPoolSize", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].timeLimitMinutes", greaterThan(0)));
    }

    @Test
    void testStartCourseAssessmentAttemptGeneratesRandomizedQuestionSetAndAttemptRecord() throws Exception {
        // Start assessment attempt for Course 2 (Distributed Systems)
        MvcResult result = mockMvc.perform(post("/api/v1/assessments/course/2/start")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.courseId", is(2)))
                .andExpect(jsonPath("$.data.attemptId", notNullValue()))
                .andExpect(jsonPath("$.data.attemptNumber", is(1)))
                .andExpect(jsonPath("$.data.questions", hasSize(5)))
                .andExpect(jsonPath("$.data.questions[0].topic", notNullValue()))
                .andExpect(jsonPath("$.data.questions[0].correctOptionIndex").doesNotExist())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        Integer attemptId = JsonPath.read(responseJson, "$.data.attemptId");
        assertNotNull(attemptId);
        assertTrue(attemptRepository.existsById(attemptId.longValue()));

        List<Integer> difficulties = JsonPath.read(responseJson, "$.data.questions[*].difficultyLevel");
        assertEquals(5, difficulties.size());
        assertEquals(1, difficulties.stream().filter(d -> d == 1).count(), "Must have exactly 1 Easy (Level 1)");
        assertEquals(2, difficulties.stream().filter(d -> d == 2).count(), "Must have exactly 2 Medium (Level 2)");
        assertEquals(2, difficulties.stream().filter(d -> d >= 3).count(), "Must have exactly 2 Hard (Level 3)");
    }

    @Test
    void testCourseAssessmentGuaranteesFiveQuestionsWithDynamicGenerationForCourseWithSmallPool() throws Exception {
        // Course 1 originally had only 3 questions in seed data.
        // Course diagnostic start must dynamically generate and return 5 questions: 1 Easy, 2 Medium, 2 Hard.
        MvcResult result = mockMvc.perform(post("/api/v1/assessments/course/1/start")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.courseId", is(1)))
                .andExpect(jsonPath("$.data.questions", hasSize(5)))
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        List<Integer> difficulties = JsonPath.read(responseJson, "$.data.questions[*].difficultyLevel");
        assertEquals(5, difficulties.size());
        assertEquals(1, difficulties.stream().filter(d -> d == 1).count(), "Must have exactly 1 Easy (Level 1)");
        assertEquals(2, difficulties.stream().filter(d -> d == 2).count(), "Must have exactly 2 Medium (Level 2)");
        assertEquals(2, difficulties.stream().filter(d -> d >= 3).count(), "Must have exactly 2 Hard (Level 3)");
    }

    @Test
    void testMultipleAttemptsForSameCourseReceiveVaryingQuestionOrdersWithoutDuplicatesInSingleAttempt() throws Exception {
        // Start Attempt 1 for Course 2
        MvcResult res1 = mockMvc.perform(post("/api/v1/assessments/course/2/start")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptNumber", is(1)))
                .andReturn();

        List<Integer> qIds1 = JsonPath.read(res1.getResponse().getContentAsString(), "$.data.questions[*].id");
        assertNotNull(qIds1);
        assertFalse(qIds1.isEmpty());

        // CRITICAL REQUIREMENT: Verify NO duplicate questions within a single attempt
        Set<Integer> uniqueQIds1 = new HashSet<>(qIds1);
        assertEquals(qIds1.size(), uniqueQIds1.size(), "No duplicate questions allowed within a single assessment attempt");

        // Start Attempt 2 for Course 2
        MvcResult res2 = mockMvc.perform(post("/api/v1/assessments/course/2/start")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptNumber", is(2)))
                .andReturn();

        List<Integer> qIds2 = JsonPath.read(res2.getResponse().getContentAsString(), "$.data.questions[*].id");
        assertNotNull(qIds2);
        Set<Integer> uniqueQIds2 = new HashSet<>(qIds2);
        assertEquals(qIds2.size(), uniqueQIds2.size(), "Attempt 2 must also contain zero duplicate questions");

        // CRITICAL REQUIREMENT: Verify that Attempt 2 provides fresh, brand new questions without repeating Attempt 1 questions
        Set<Integer> overlap = new HashSet<>(qIds1);
        overlap.retainAll(qIds2);
        assertTrue(overlap.isEmpty(), "Zero question overlap between Attempt 1 and Attempt 2! Fresh questions must be generated/selected on retakes.");
    }

    @Test
    void testPreventDuplicateSubmissionForSameAttempt() throws Exception {
        // Start attempt for Course 4 (PostgreSQL)
        MvcResult startRes = mockMvc.perform(post("/api/v1/assessments/course/4/start")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andReturn();

        String startJson = startRes.getResponse().getContentAsString();
        Integer attemptId = JsonPath.read(startJson, "$.data.attemptId");
        Integer assessmentId = JsonPath.read(startJson, "$.data.assessmentId");
        List<Integer> qIds = JsonPath.read(startJson, "$.data.questions[*].id");

        List<AnswerSubmissionDto> answers = List.of(
                new AnswerSubmissionDto(qIds.get(0).longValue(), 1),
                new AnswerSubmissionDto(qIds.get(1).longValue(), 1)
        );

        AssessmentSubmissionRequestDto submissionRequest = new AssessmentSubmissionRequestDto(
                attemptId.longValue(),
                OffsetDateTime.now().minusMinutes(3),
                answers
        );

        // First submission succeeds
        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submissionRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Duplicate submission for the SAME attempt ID must be rejected!
        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submissionRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Duplicate submission rejected")));
    }

    @Test
    void testSubmitCourseAssessmentReturnsKnowledgeGapsAndRecommendedCourses() throws Exception {
        // Start attempt for Course 3 (Production ML)
        MvcResult startRes = mockMvc.perform(post("/api/v1/assessments/course/3/start")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isOk())
                .andReturn();

        String startJson = startRes.getResponse().getContentAsString();
        Integer attemptId = JsonPath.read(startJson, "$.data.attemptId");
        Integer assessmentId = JsonPath.read(startJson, "$.data.assessmentId");
        List<Integer> qIds = JsonPath.read(startJson, "$.data.questions[*].id");

        // Submit one answer
        AssessmentSubmissionRequestDto submissionRequest = new AssessmentSubmissionRequestDto(
                attemptId.longValue(),
                OffsetDateTime.now().minusMinutes(2),
                List.of(new AnswerSubmissionDto(qIds.get(0).longValue(), 0))
        );

        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/submit")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submissionRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                // Verify knowledge gaps and recommended courses are present
                .andExpect(jsonPath("$.data.attemptId", is(attemptId)))
                .andExpect(jsonPath("$.data.courseId", is(3)))
                .andExpect(jsonPath("$.data.knowledgeGaps", notNullValue()))
                .andExpect(jsonPath("$.data.questionFeedback[0].explanation", notNullValue()))
                .andExpect(jsonPath("$.data.questionFeedback[0].topic", notNullValue()))
                .andExpect(jsonPath("$.data.questionFeedback[0].correctOptionIndex", notNullValue()));
    }

    @Test
    void testDynamicQuestionGenerationWhenPoolIsEmpty() {
        // Create a new course without pre-existing questions
        Course newCourse = new Course();
        newCourse.setTitle("Advanced Quantum Computing with Qiskit");
        newCourse.setProvider("IBM Quantum Network");
        newCourse.setDurationHours(20);
        newCourse.setDifficultyLevel("ADVANCED");
        Course savedCourse = courseRepository.save(newCourse);

        Assessment newAssessment = new Assessment();
        newAssessment.setTitle("Quantum Computing Diagnostic");
        newAssessment.setCourse(savedCourse);
        newAssessment.setSkill(employeeSkillRepository.findAll().get(0).getSkill());
        Assessment savedAssessment = assessmentRepository.save(newAssessment);

        // Generate questions dynamically
        var generated = questionGeneratorService.generateAndSaveQuestionsForCourse(savedCourse, savedAssessment);
        assertNotNull(generated);
        assertFalse(generated.isEmpty(), "Dynamic question generator should synthesize valid curriculum questions");
        assertEquals(5, generated.size());
        assertTrue(generated.get(0).getQuestionText().contains("Quantum Computing"));
        assertNotNull(generated.get(0).getExplanation());
        assertEquals(4, generated.get(0).parseOptions().size());
        assertEquals(1, generated.get(0).getDifficultyLevel(), "Question 1 should be Easy (Level 1)");
        assertEquals(2, generated.get(1).getDifficultyLevel(), "Question 2 should be Medium (Level 2)");
        assertEquals(2, generated.get(2).getDifficultyLevel(), "Question 3 should be Medium (Level 2)");
        assertEquals(3, generated.get(3).getDifficultyLevel(), "Question 4 should be Hard (Level 3)");
        assertEquals(3, generated.get(4).getDifficultyLevel(), "Question 5 should be Hard (Level 3)");
    }

    @Test
    void testGenerateQuestionsEndpointsWithRoleAuthorizationAndFallback() throws Exception {
        // Employees should be forbidden from triggering question generation
        mockMvc.perform(post("/api/v1/assessments/course/2/generate-questions?count=3")
                .header("Authorization", employeeDavidToken))
                .andExpect(status().isForbidden());

        // Managers are authorized to generate questions for course
        mockMvc.perform(post("/api/v1/assessments/course/2/generate-questions?count=3")
                .header("Authorization", managerEngToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("generated successfully")))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // Admins are authorized to generate questions for assessment by ID
        mockMvc.perform(post("/api/v1/assessments/1/generate-questions?count=2")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].questionText", notNullValue()))
                .andExpect(jsonPath("$.data[0].options", hasSize(4)))
                .andExpect(jsonPath("$.data[0].correctOptionIndex").doesNotExist());
    }
}
