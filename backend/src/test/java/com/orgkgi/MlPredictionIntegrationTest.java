package com.orgkgi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.ml.PredictOutcomeRequest;
import com.orgkgi.dto.ml.PredictionResultDto;
import com.orgkgi.entity.Assessment;
import com.orgkgi.entity.AssessmentSubmission;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.exception.IncompleteDataException;
import com.orgkgi.exception.MlServiceUnavailableException;
import com.orgkgi.repository.AssessmentRepository;
import com.orgkgi.repository.AssessmentSubmissionRepository;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.TrainingPredictionRepository;
import com.orgkgi.security.JwtTokenProvider;
import com.orgkgi.service.MlPredictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.orgkgi.entity.Role;
import com.orgkgi.security.UserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class MlPredictionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MlPredictionService mlPredictionService;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentSubmissionRepository assessmentSubmissionRepository;

    @Autowired
    private TrainingPredictionRepository predictionRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String employeeDavidToken; // David Kim (Profile 2, User 4)

    @BeforeEach
    void setUp() {
        employeeDavidToken = "Bearer " + tokenProvider.generateTokenFromUser(4L, "david.junior@orgkgi.dev", "EMPLOYEE");
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        predictionRepository.deleteAll();
        assessmentSubmissionRepository.deleteAll();
    }

    @Test
    void testMissingDiagnosticScoreRejectsPredictionWithoutInventingData() {
        // Authenticate as David Kim (User ID 4)
        UserPrincipal principal = new UserPrincipal(4L, "david.junior@orgkgi.dev", "", Role.EMPLOYEE, 1L, true, List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        // Clear any assessment submissions for David Kim (Profile 2)
        assessmentSubmissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(2L)
            .forEach(assessmentSubmissionRepository::delete);

        PredictOutcomeRequest request = new PredictOutcomeRequest(2L, 1L, 1L, null);

        IncompleteDataException ex = assertThrows(IncompleteDataException.class, () -> {
            mlPredictionService.predictTrainingOutcome(request);
        });

        assertTrue(ex.getMessage().contains("Missing required data"), "Must explicitly report missing data");
        assertTrue(ex.getMissingFields().stream().anyMatch(f -> f.contains("diagnostic_assessment_score")),
            "Must report diagnostic_assessment_score as missing rather than inventing fake data");
    }

    @Test
    void testMissingDiagnosticScoreReturns400BadRequest() throws Exception {
        assessmentSubmissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(2L)
            .forEach(assessmentSubmissionRepository::delete);

        PredictOutcomeRequest request = new PredictOutcomeRequest(2L, 1L, 1L, null);

        mockMvc.perform(post("/api/v1/ml/predict/training-outcome")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Missing required data")));
    }

    @Test
    void testSuccessfulPredictionWithAuthenticFeaturesAgainstLiveMlService() throws Exception {
        // 1. Seed authentic diagnostic assessment submission for David Kim (Profile 2)
        EmployeeProfile david = employeeProfileRepository.findById(2L).orElseThrow();
        Assessment springAssessment = assessmentRepository.findById(1L).orElseThrow();

        // Clear existing submissions first
        assessmentSubmissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(2L)
            .forEach(assessmentSubmissionRepository::delete);

        AssessmentSubmission submission = new AssessmentSubmission();
        submission.setEmployeeProfile(david);
        submission.setAssessment(springAssessment);
        submission.setScore(BigDecimal.valueOf(82.50));
        submission.setPassed(true);
        submission.setAttemptedAt(OffsetDateTime.now());
        assessmentSubmissionRepository.save(submission);

        // 2. Perform live prediction for Course 1 (Advanced Spring Boot, Course difficulty 3)
        PredictOutcomeRequest request = new PredictOutcomeRequest(2L, 1L, 1L, 8.0);

        mockMvc.perform(post("/api/v1/ml/predict/training-outcome")
                .header("Authorization", employeeDavidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.employeeProfileId", is(2)))
                .andExpect(jsonPath("$.data.predictedOutcome", isOneOf("SUCCESS", "AT_RISK")))
                .andExpect(jsonPath("$.data.predictedSuccessProbability", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.data.predictedSuccessProbability", lessThanOrEqualTo(1.0)))
                .andExpect(jsonPath("$.data.riskLevel", isOneOf("LOW", "MEDIUM", "HIGH")))
                .andExpect(jsonPath("$.data.modelVersion", is("v1.0.0-dev")))
                .andExpect(jsonPath("$.data.dataProvenance", is("SYNTHETIC_DEVELOPMENT_DATASET")))
                .andExpect(jsonPath("$.data.modelDisclaimer", containsString("Development Model: Trained and evaluated on synthetic organizational data")));

        // 3. Verify prediction persistence in database
        assertFalse(predictionRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(2L).isEmpty(),
            "Valid prediction result must be persisted to database");
    }

    @Test
    void testMlServiceUnavailableHandling() {
        // Construct an MlPredictionService pointing to an unreachable port (e.g. 59999)
        MlPredictionService unreachableService = new MlPredictionService(
            "http://localhost:59999",
            1000,
            employeeProfileRepository,
            null,
            null,
            assessmentSubmissionRepository,
            null,
            predictionRepository,
            null,
            objectMapper
        );

        com.orgkgi.dto.ml.MlPredictionRequest request = new com.orgkgi.dto.ml.MlPredictionRequest(
            3.0, 4.0, 0.8, 80.0, 8.0, 2, 1, 12
        );

        MlServiceUnavailableException ex = assertThrows(MlServiceUnavailableException.class, () -> {
            unreachableService.callMlService(request);
        });

        assertTrue(ex.getMessage().contains("unreachable"), "Should clearly report that ML microservice is unreachable");
    }
}
