package com.orgkgi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.ml.*;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.IncompleteDataException;
import com.orgkgi.exception.MlServiceUnavailableException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@Service
public class MlPredictionService {

    private static final Logger logger = LoggerFactory.getLogger(MlPredictionService.class);

    private final RestClient restClient;
    private final String mlServiceUrl;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final CourseRepository courseRepository;
    private final LearningPathRepository learningPathRepository;
    private final AssessmentSubmissionRepository assessmentSubmissionRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final TrainingPredictionRepository predictionRepository;
    private final SkillGapService skillGapService;
    private final ObjectMapper objectMapper;

    public MlPredictionService(
            @Value("${ml.service.url:http://localhost:8000}") String mlServiceUrl,
            @Value("${ml.service.timeout-ms:5000}") int timeoutMs,
            EmployeeProfileRepository employeeProfileRepository,
            CourseRepository courseRepository,
            LearningPathRepository learningPathRepository,
            AssessmentSubmissionRepository assessmentSubmissionRepository,
            MentorAssignmentRepository mentorAssignmentRepository,
            TrainingPredictionRepository predictionRepository,
            SkillGapService skillGapService,
            ObjectMapper objectMapper) {

        this.mlServiceUrl = mlServiceUrl;
        this.employeeProfileRepository = employeeProfileRepository;
        this.courseRepository = courseRepository;
        this.learningPathRepository = learningPathRepository;
        this.assessmentSubmissionRepository = assessmentSubmissionRepository;
        this.mentorAssignmentRepository = mentorAssignmentRepository;
        this.predictionRepository = predictionRepository;
        this.skillGapService = skillGapService;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));

        this.restClient = RestClient.builder()
            .baseUrl(mlServiceUrl)
            .requestFactory(requestFactory)
            .build();
    }

    @Transactional
    public PredictionResultDto predictTrainingOutcome(PredictOutcomeRequest request) {
        EmployeeProfile profile = employeeProfileRepository.findById(request.getEmployeeProfileId())
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", request.getEmployeeProfileId()));

        Long userDeptId = profile.getUser().getDepartment() != null ? profile.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(profile.getUser().getId(), userDeptId);

        Course course = courseRepository.findById(request.getCourseId())
            .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        LearningPath learningPath = null;
        if (request.getLearningPathId() != null) {
            learningPath = learningPathRepository.findById(request.getLearningPathId())
                .orElseThrow(() -> new ResourceNotFoundException("LearningPath", "id", request.getLearningPathId()));
        }

        // 1. Extract and Validate Features from authentic database records
        MlPredictionRequest mlRequest = buildPredictionFeatures(profile, course, request.getWeeklyEngagementHoursOverride());

        // 2. Invoke Machine Learning microservice with graceful error handling
        MlPredictionResponse mlResponse = callMlService(mlRequest);

        // 3. Persist valid prediction result to database
        TrainingPrediction entity = new TrainingPrediction();
        entity.setEmployeeProfile(profile);
        entity.setLearningPath(learningPath);
        entity.setPredictedOutcome(mlResponse.getPredictedOutcome());
        entity.setPredictedSuccessProbability(BigDecimal.valueOf(mlResponse.getSuccessProbability()));
        entity.setRiskLevel(mlResponse.getRiskLevel());
        entity.setModelVersion(mlResponse.getModelVersion());

        try {
            entity.setFeatureSnapshotJson(objectMapper.writeValueAsString(mlResponse.getFeatureSnapshot()));
        } catch (JsonProcessingException e) {
            entity.setFeatureSnapshotJson("{}");
        }

        TrainingPrediction saved = predictionRepository.save(entity);

        // 4. Map to Result DTO with clear synthetic-data provenance declaration
        PredictionResultDto dto = new PredictionResultDto();
        dto.setId(saved.getId());
        dto.setEmployeeProfileId(profile.getId());
        dto.setEmployeeFullName(profile.getUser().getFullName());
        dto.setCourseId(course.getId());
        dto.setCourseTitle(course.getTitle());
        dto.setLearningPathId(learningPath != null ? learningPath.getId() : null);

        dto.setPredictedOutcome(saved.getPredictedOutcome());
        dto.setPredictedSuccessProbability(saved.getPredictedSuccessProbability());
        dto.setRiskLevel(saved.getRiskLevel());
        dto.setModelVersion(saved.getModelVersion());
        dto.setDataProvenance(mlResponse.getDataProvenance());
        dto.setModelDisclaimer("Development Model: Trained and evaluated on synthetic organizational data. " +
            "Predictions reflect statistical machine learning modeling for development and demonstration purposes.");
        dto.setFeatureSnapshot(mlResponse.getFeatureSnapshot());
        dto.setCreatedAt(saved.getCreatedAt());

        return dto;
    }

    public MlPredictionRequest buildPredictionFeatures(EmployeeProfile profile, Course course, Double hoursOverride) {
        List<String> missingFields = new ArrayList<>();

        // Feature 1: Baseline Proficiency Avg from SkillGapService
        SkillGapReportDto report = skillGapService.generateReport(profile);
        Double baselineProficiencyAvg = report.getAverageVerifiedProficiency();
        if (baselineProficiencyAvg == null || baselineProficiencyAvg <= 0.0) {
            // If no verified skills, check if any self-reported skills exist or report missing data
            if (report.getVerifiedSkillsCount() == 0) {
                missingFields.add("verified_baseline_proficiency (No manager-verified or assessed skills on record)");
            } else {
                baselineProficiencyAvg = 1.0;
            }
        }
        baselineProficiencyAvg = Math.max(1.0, Math.min(5.0, baselineProficiencyAvg));

        // Feature 2: Initial Gap Magnitude
        Double initialGapMagnitude = report.getTotalWeightedGap();
        if (initialGapMagnitude == null) {
            initialGapMagnitude = 0.0;
        }
        initialGapMagnitude = Math.max(0.0, Math.min(20.0, initialGapMagnitude));

        // Feature 3: Historical Completion Rate
        Double historicalCompletionRate = calculateHistoricalCompletionRate(profile);

        // Feature 4: Diagnostic Assessment Score
        List<AssessmentSubmission> submissions = assessmentSubmissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(profile.getId());
        Double diagnosticScore = null;
        if (!submissions.isEmpty()) {
            diagnosticScore = submissions.get(0).getScore().doubleValue();
        } else {
            missingFields.add("diagnostic_assessment_score (No diagnostic assessment submission recorded for employee)");
        }

        // Feature 5: Weekly Engagement Hours
        Double weeklyEngagementHours = hoursOverride;
        if (weeklyEngagementHours == null) {
            if (profile.getMentorAvailabilityHrsPerWeek() != null && profile.getMentorAvailabilityHrsPerWeek() > 0) {
                weeklyEngagementHours = profile.getMentorAvailabilityHrsPerWeek().doubleValue();
            } else {
                weeklyEngagementHours = 6.0; // Standard company study allotment
            }
        }
        weeklyEngagementHours = Math.max(0.5, Math.min(40.0, weeklyEngagementHours));

        // Feature 6: Course Difficulty Level (1 = Beginner, 2 = Intermediate, 3 = Advanced)
        int courseDifficulty = course.getDifficultyNumeric();

        // Feature 7: Mentor Assigned Flag
        List<MentorAssignment> activeAssignments = mentorAssignmentRepository.findByMenteeIdAndStatus(
            profile.getId(), MentorAssignmentStatus.ACTIVE
        );
        if (activeAssignments.isEmpty()) {
            activeAssignments = mentorAssignmentRepository.findByMenteeIdAndStatus(
                profile.getId(), MentorAssignmentStatus.APPROVED_BY_MANAGER
            );
        }
        int mentorAssignedFlag = !activeAssignments.isEmpty() ? 1 : 0;

        // Feature 8: Tenure Months
        int tenureMonths;
        if (profile.getHireDate() != null) {
            tenureMonths = (int) Period.between(profile.getHireDate(), LocalDate.now()).toTotalMonths();
            if (tenureMonths < 0) tenureMonths = 0;
        } else {
            missingFields.add("hire_date (Tenure calculation requires employee hire date)");
            tenureMonths = 0;
        }

        if (!missingFields.isEmpty()) {
            throw new IncompleteDataException("Cannot perform machine learning outcome prediction due to missing required inputs.", missingFields);
        }

        return new MlPredictionRequest(
            baselineProficiencyAvg,
            initialGapMagnitude,
            historicalCompletionRate,
            diagnosticScore,
            weeklyEngagementHours,
            courseDifficulty,
            mentorAssignedFlag,
            tenureMonths
        );
    }

    private Double calculateHistoricalCompletionRate(EmployeeProfile profile) {
        List<LearningPath> paths = learningPathRepository.findByEmployeeProfileId(profile.getId());
        if (paths.isEmpty()) {
            return 0.75; // Default neutral baseline for new employees without prior learning history
        }

        int totalCourses = 0;
        int completedCourses = 0;

        for (LearningPath lp : paths) {
            if (lp.getLearningPathCourses() != null) {
                for (LearningPathCourse lpc : lp.getLearningPathCourses()) {
                    totalCourses++;
                    if ("COMPLETED".equalsIgnoreCase(lpc.getStatus())) {
                        completedCourses++;
                    }
                }
            }
        }

        if (totalCourses == 0) {
            return 0.75;
        }

        return Math.round(((double) completedCourses / totalCourses) * 100.0) / 100.0;
    }

    public MlPredictionResponse callMlService(MlPredictionRequest request) {
        try {
            return restClient.post()
                .uri("/api/v1/predict/outcome")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(MlPredictionResponse.class);
        } catch (ResourceAccessException e) {
            logger.error("Failed to connect to ML prediction service at {}: {}", mlServiceUrl, e.getMessage());
            throw new MlServiceUnavailableException("ML Prediction microservice is currently unreachable at " + mlServiceUrl + ". " +
                "Please verify that the FastAPI microservice is running on port 8000.", e);
        } catch (RestClientResponseException e) {
            logger.error("ML service returned HTTP error {} at {}: {}", e.getStatusCode(), mlServiceUrl, e.getResponseBodyAsString());
            throw new MlServiceUnavailableException("ML Prediction microservice returned error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            logger.error("Unexpected error communicating with ML service at {}: {}", mlServiceUrl, e.getMessage());
            throw new MlServiceUnavailableException("Unexpected error during ML outcome prediction: " + e.getMessage(), e);
        }
    }
}
