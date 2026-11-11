package com.orgkgi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.assessment.*;
import com.orgkgi.dto.course.CourseRecommendationDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AssessmentService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentSubmissionRepository submissionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final CourseRepository courseRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final AssessmentQuestionSelectionService questionSelectionService;
    private final CourseRecommendationService courseRecommendationService;
    private final CourseQuestionGeneratorService questionGeneratorService;
    private final CourseCertificateRepository certificateRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final CourseApprovalRequestRepository approvalRequestRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final MentorshipMessageRepository mentorshipMessageRepository;
    private final NotificationRepository notificationRepository;

    public AssessmentService(
            AssessmentRepository assessmentRepository,
            AssessmentQuestionRepository questionRepository,
            AssessmentSubmissionRepository submissionRepository,
            AssessmentAttemptRepository attemptRepository,
            EmployeeProfileRepository employeeProfileRepository,
            EmployeeSkillRepository employeeSkillRepository,
            CourseRepository courseRepository,
            CourseSkillRepository courseSkillRepository,
            AssessmentQuestionSelectionService questionSelectionService,
            CourseRecommendationService courseRecommendationService,
            CourseQuestionGeneratorService questionGeneratorService,
            CourseCertificateRepository certificateRepository,
            LearningPathRepository learningPathRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            CourseApprovalRequestRepository approvalRequestRepository,
            MentorAssignmentRepository mentorAssignmentRepository,
            MentorshipMessageRepository mentorshipMessageRepository,
            NotificationRepository notificationRepository) {
        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.attemptRepository = attemptRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.courseRepository = courseRepository;
        this.courseSkillRepository = courseSkillRepository;
        this.questionSelectionService = questionSelectionService;
        this.courseRecommendationService = courseRecommendationService;
        this.questionGeneratorService = questionGeneratorService;
        this.certificateRepository = certificateRepository;
        this.learningPathRepository = learningPathRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.mentorAssignmentRepository = mentorAssignmentRepository;
        this.mentorshipMessageRepository = mentorshipMessageRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<AssessmentSummaryDto> getAssessmentsForSkill(Long skillId) {
        List<Assessment> assessments = assessmentRepository.findBySkillId(skillId);
        return assessments.stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssessmentSummaryDto> getAllAssessments() {
        return assessmentRepository.findAll().stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssessmentSummaryDto getAssessmentById(Long id) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", id));
        return toSummaryDto(assessment);
    }

    /**
     * Lists all eligible courses with their associated diagnostic assessments,
     * available questions pool size, and current employee attempt status.
     */
    @Transactional
    public List<CourseAssessmentEligibilityDto> getEligibleCoursesForAssessment() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = currentUserId != null
                ? employeeProfileRepository.findByUserId(currentUserId).orElse(null)
                : null;

        List<Course> courses = courseRepository.findAll();
        List<CourseSkill> allCourseSkills = courseSkillRepository.findAllWithCourseAndSkill();
        Map<Long, List<CourseSkill>> courseSkillMap = allCourseSkills.stream()
                .collect(Collectors.groupingBy(cs -> cs.getCourse().getId()));

        List<CourseAssessmentEligibilityDto> list = new ArrayList<>();

        for (Course course : courses) {
            Assessment assessment = getOrCreateAssessmentForCourse(course.getId());
            long poolSize = questionRepository.countByCourseId(course.getId());
            if (poolSize == 0 && assessment != null) {
                poolSize = questionRepository.countByAssessmentId(assessment.getId());
            }

            Integer totalAttempts = 0;
            BigDecimal bestScore = null;
            OffsetDateTime latestAttemptDate = null;
            Boolean latestPassed = null;

            if (profile != null) {
                List<AssessmentSubmission> userSubmissions =
                        submissionRepository.findByEmployeeProfileIdAndCourseIdOrderByAttemptedAtDesc(profile.getId(), course.getId());
                if (userSubmissions.isEmpty() && assessment != null) {
                    userSubmissions = submissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(profile.getId()).stream()
                            .filter(s -> Objects.equals(s.getAssessment().getId(), assessment.getId()))
                            .toList();
                }

                if (!userSubmissions.isEmpty()) {
                    totalAttempts = userSubmissions.size();
                    bestScore = userSubmissions.stream()
                            .map(AssessmentSubmission::getScore)
                            .max(BigDecimal::compareTo)
                            .orElse(null);
                    AssessmentSubmission latest = userSubmissions.get(0);
                    latestAttemptDate = latest.getAttemptedAt();
                    latestPassed = latest.getPassed();
                }
            }

            List<CourseSkill> skills = courseSkillMap.getOrDefault(course.getId(), Collections.emptyList());
            Long primarySkillId = !skills.isEmpty() ? skills.get(0).getSkill().getId() : (assessment != null ? assessment.getSkill().getId() : null);
            String primarySkillName = !skills.isEmpty() ? skills.get(0).getSkill().getName() : (assessment != null ? assessment.getSkill().getName() : "General");

            list.add(new CourseAssessmentEligibilityDto(
                    course.getId(),
                    course.getTitle(),
                    course.getProvider(),
                    course.getDifficultyLevel(),
                    course.getRating(),
                    course.getDurationHours(),
                    primarySkillId,
                    primarySkillName,
                    assessment != null ? assessment.getId() : null,
                    (int) poolSize,
                    totalAttempts,
                    bestScore,
                    latestAttemptDate,
                    latestPassed,
                    assessment != null ? assessment.getTimeLimitMinutes() : 25,
                    assessment != null ? assessment.getPassingScore() : new BigDecimal("70.00")
            ));
        }

        return list;
    }

    /**
     * Gets or creates a diagnostic assessment entity for a given course.
     */
    @Transactional
    public Assessment getOrCreateAssessmentForCourse(Long courseId) {
        Optional<Assessment> existing = assessmentRepository.findByCourseId(courseId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        List<CourseSkill> skills = courseSkillRepository.findByCourseId(courseId);
        Skill primarySkill = !skills.isEmpty()
                ? skills.get(0).getSkill()
                : employeeSkillRepository.findAll().stream().map(EmployeeSkill::getSkill).findFirst()
                .orElseThrow(() -> new IllegalStateException("No skills found in database to map course assessment"));

        Assessment newAssessment = new Assessment();
        newAssessment.setTitle(course.getTitle() + " Diagnostic Assessment");
        newAssessment.setCourse(course);
        newAssessment.setSkill(primarySkill);
        newAssessment.setDescription("Comprehensive diagnostic assessment validating production knowledge for " + course.getTitle());
        newAssessment.setPassingScore(new BigDecimal("70.00"));
        newAssessment.setTimeLimitMinutes(Math.max(15, Math.min(45, course.getDurationHours() != null ? course.getDurationHours() : 25)));

        return assessmentRepository.save(newAssessment);
    }

    /**
     * Retrieves questions and answer options dynamically without exposing correct answers.
     */
    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsSafe(Long assessmentId) {
        if (!assessmentRepository.existsById(assessmentId)) {
            throw new ResourceNotFoundException("Assessment", "id", assessmentId);
        }
        List<AssessmentQuestion> questions = questionRepository.findByAssessmentIdOrderByIdAsc(assessmentId);
        return questions.stream().map(q -> new QuestionDto(
                q.getId(),
                q.getQuestionText(),
                q.parseOptions(),
                q.getDifficultyLevel(),
                q.getTopic(),
                q.getEstimatedTimeSeconds()
        )).collect(Collectors.toList());
    }

    /**
     * Starts an assessment attempt by assessment ID, establishing an attempt record,
     * randomized question set, and time limit window.
     */
    @Transactional
    public AssessmentAttemptStartDto startAssessmentAttempt(Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", assessmentId));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile employeeProfile = currentUserId != null
                ? employeeProfileRepository.findByUserId(currentUserId).orElse(null)
                : null;

        Long profileId = employeeProfile != null ? employeeProfile.getId() : null;
        Course course = assessment.getCourse();

        // Dynamically select and randomize questions
        AssessmentQuestionSelectionService.SelectedQuestionBundle bundle =
                questionSelectionService.selectQuestionsForAttempt(profileId, assessment, course, AssessmentQuestionSelectionService.DEFAULT_ASSESSMENT_LENGTH);

        OffsetDateTime startedAt = OffsetDateTime.now();
        OffsetDateTime expiresAt = startedAt.plusMinutes(assessment.getTimeLimitMinutes());

        AssessmentAttempt attempt = null;
        if (employeeProfile != null) {
            long prevAttempts = attemptRepository.countByEmployeeProfileIdAndAssessmentId(profileId, assessmentId);
            attempt = new AssessmentAttempt();
            attempt.setEmployeeProfile(employeeProfile);
            attempt.setAssessment(assessment);
            attempt.setCourse(course);
            attempt.setAttemptNumber((int) (prevAttempts + 1));
            attempt.setStatus("IN_PROGRESS");
            attempt.setQuestionIdsList(bundle.getQuestionIds());
            attempt.setOptionsShuffledJson(bundle.getOptionsShuffledJson());
            attempt.setTotalQuestions(bundle.getDisplayQuestions().size());
            attempt.setStartedAt(startedAt);
            attempt.setExpiresAt(expiresAt);
            attempt = attemptRepository.save(attempt);
        }

        return new AssessmentAttemptStartDto(
                attempt != null ? attempt.getId() : null,
                attempt != null ? attempt.getAttemptNumber() : 1,
                course != null ? course.getId() : null,
                course != null ? course.getTitle() : assessment.getTitle(),
                assessment.getId(),
                assessment.getTitle(),
                assessment.getSkill().getId(),
                assessment.getSkill().getName(),
                assessment.getPassingScore(),
                assessment.getTimeLimitMinutes(),
                startedAt,
                expiresAt,
                bundle.getDisplayQuestions().size(),
                bundle.getDisplayQuestions()
        );
    }

    /**
     * Starts an assessment attempt specifically for a course ID.
     */
    @Transactional
    public AssessmentAttemptStartDto startCourseAssessmentAttempt(Long courseId) {
        Assessment assessment = getOrCreateAssessmentForCourse(courseId);
        return startAssessmentAttempt(assessment.getId());
    }

    /**
     * Evaluates diagnostic assessment submission, computes server-side score, and updates
     * employee skill proficiency according to the verified proficiency policy.
     */
    @Transactional
    public AssessmentResultDto submitAssessment(Long assessmentId, AssessmentSubmissionRequestDto request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile employeeProfile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", assessmentId));

        OffsetDateTime now = OffsetDateTime.now();

        // 1. Enforce attempt verification & duplicate submission prevention
        AssessmentAttempt attempt = null;
        if (request.getAttemptId() != null) {
            attempt = attemptRepository.findById(request.getAttemptId())
                    .orElseThrow(() -> new ResourceNotFoundException("AssessmentAttempt", "id", request.getAttemptId()));

            if ("COMPLETED".equalsIgnoreCase(attempt.getStatus())) {
                throw new BadRequestException("Duplicate submission rejected: This assessment attempt has already been submitted and scored.");
            }
        }

        // 2. Enforce time limit if start timestamp is supplied
        OffsetDateTime startedAt = request.getStartedAt() != null
                ? request.getStartedAt()
                : (attempt != null ? attempt.getStartedAt() : null);

        if (startedAt != null) {
            long elapsedMinutes = Duration.between(startedAt, now).toMinutes();
            // 2 minutes grace period for network latency / client clock jitter
            if (elapsedMinutes > (assessment.getTimeLimitMinutes() + 2)) {
                throw new BadRequestException("Assessment submission rejected: time limit exceeded ("
                        + elapsedMinutes + " mins elapsed, allowed limit is " + assessment.getTimeLimitMinutes() + " mins).");
            }
        }

        // 3. Fetch all potential questions (either assigned to attempt, or belonging to assessment/course)
        List<AssessmentQuestion> questions;
        if (attempt != null && !attempt.parseQuestionIds().isEmpty()) {
            List<Long> qIds = attempt.parseQuestionIds();
            questions = questionRepository.findAllById(qIds);
        } else {
            questions = questionRepository.findByAssessmentIdOrderByIdAsc(assessmentId);
        }

        if (questions.isEmpty()) {
            throw new BadRequestException("Assessment has no questions configured.");
        }

        Map<Long, AssessmentQuestion> questionMap = questions.stream()
                .collect(Collectors.toMap(AssessmentQuestion::getId, Function.identity()));

        if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
            throw new BadRequestException("Submission must contain answers.");
        }

        // Parse shuffled option mapping if available
        Map<String, Map<String, Object>> shuffledOptionsMap = new HashMap<>();
        if (attempt != null && attempt.getOptionsShuffledJson() != null && !attempt.getOptionsShuffledJson().isBlank()) {
            try {
                shuffledOptionsMap = MAPPER.readValue(attempt.getOptionsShuffledJson(),
                        new TypeReference<Map<String, Map<String, Object>>>() {});
            } catch (Exception e) {
                log.warn("Could not parse optionsShuffledJson for attemptId={}", attempt.getId());
            }
        }

        // Validate answer indexes and question ownership
        Set<Long> answeredQuestionIds = new HashSet<>();
        for (AnswerSubmissionDto ans : request.getAnswers()) {
            if (!questionMap.containsKey(ans.getQuestionId())) {
                throw new BadRequestException("Question ID " + ans.getQuestionId() + " does not belong to assessment " + assessmentId);
            }
            if (!answeredQuestionIds.add(ans.getQuestionId())) {
                throw new BadRequestException("Duplicate answer submitted for question ID " + ans.getQuestionId());
            }

            AssessmentQuestion q = questionMap.get(ans.getQuestionId());
            List<String> options = q.parseOptions();
            if (ans.getSelectedOptionIndex() < 0 || ans.getSelectedOptionIndex() >= options.size()) {
                throw new BadRequestException("Selected option index " + ans.getSelectedOptionIndex()
                        + " is out of range for question ID " + q.getId() + " (valid 0 to " + (options.size() - 1) + ")");
            }
        }

        // 4. Compute server-side score deterministically & build rich question review
        int correctCount = 0;
        List<QuestionFeedbackDto> feedbackList = new ArrayList<>();
        Map<Long, AnswerSubmissionDto> submittedAnswerMap = request.getAnswers().stream()
                .collect(Collectors.toMap(AnswerSubmissionDto::getQuestionId, Function.identity()));

        // Topic mastery tracking for Knowledge Gap identification
        Map<String, int[]> topicStats = new HashMap<>(); // topic -> [tested, missed]

        for (AssessmentQuestion q : questions) {
            AnswerSubmissionDto submittedAnswer = submittedAnswerMap.get(q.getId());
            boolean isCorrect = false;
            Integer selectedIndex = null;

            // Determine the expected correct option index
            int expectedCorrectIndex = q.getCorrectOptionIndex();
            List<String> displayOptions = q.parseOptions();

            Map<String, Object> qMeta = shuffledOptionsMap.get(String.valueOf(q.getId()));
            if (qMeta != null && qMeta.containsKey("shuffledCorrectIndex")) {
                expectedCorrectIndex = (Integer) qMeta.get("shuffledCorrectIndex");
                if (qMeta.containsKey("shuffledOptions")) {
                    displayOptions = (List<String>) qMeta.get("shuffledOptions");
                }
            }

            if (submittedAnswer != null) {
                selectedIndex = submittedAnswer.getSelectedOptionIndex();
                if (Objects.equals(selectedIndex, expectedCorrectIndex)) {
                    isCorrect = true;
                    correctCount++;
                }
            }

            String topic = q.getTopic() != null ? q.getTopic() : assessment.getSkill().getName();
            topicStats.computeIfAbsent(topic, k -> new int[2]);
            topicStats.get(topic)[0]++; // tested++
            if (!isCorrect) {
                topicStats.get(topic)[1]++; // missed++
            }

            feedbackList.add(new QuestionFeedbackDto(
                    q.getId(),
                    selectedIndex,
                    isCorrect,
                    q.getDifficultyLevel(),
                    q.getQuestionText(),
                    displayOptions,
                    expectedCorrectIndex,
                    q.getExplanation(),
                    topic
            ));
        }

        BigDecimal score = BigDecimal.valueOf((double) correctCount / questions.size() * 100.0)
                .setScale(2, RoundingMode.HALF_UP);
        boolean passed = score.compareTo(assessment.getPassingScore()) >= 0;

        // 5. Construct topic-level knowledge gaps
        List<AssessmentKnowledgeGapDto> knowledgeGaps = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : topicStats.entrySet()) {
            String topicName = entry.getKey();
            int tested = entry.getValue()[0];
            int missed = entry.getValue()[1];
            if (missed > 0) {
                double mastery = Math.round(((double) (tested - missed) / tested * 100.0) * 10.0) / 10.0;
                String severity = mastery < 50.0 ? "HIGH" : (mastery < 80.0 ? "MEDIUM" : "LOW");
                knowledgeGaps.add(new AssessmentKnowledgeGapDto(topicName, tested, missed, mastery, severity));
            }
        }
        knowledgeGaps.sort(Comparator.comparing(AssessmentKnowledgeGapDto::getMasteryPercentage));

        // 6. Update AssessmentAttempt record
        if (attempt != null) {
            attempt.setStatus("COMPLETED");
            attempt.setScore(score);
            attempt.setPassed(passed);
            attempt.setCorrectQuestions(correctCount);
            attempt.setCompletedAt(now);
            try {
                attempt.setAnswersSubmittedJson(MAPPER.writeValueAsString(request.getAnswers()));
            } catch (Exception e) {
                attempt.setAnswersSubmittedJson("[]");
            }
            attemptRepository.save(attempt);
        }

        // 7. Persist assessment submission
        String answersJson;
        try {
            answersJson = MAPPER.writeValueAsString(feedbackList);
        } catch (Exception e) {
            answersJson = "[]";
        }

        AssessmentSubmission submission = new AssessmentSubmission();
        submission.setEmployeeProfile(employeeProfile);
        submission.setAssessment(assessment);
        submission.setCourse(assessment.getCourse());
        submission.setAttempt(attempt);
        submission.setAttemptNumber(attempt != null ? attempt.getAttemptNumber() : 1);
        submission.setScore(score);
        submission.setPassed(passed);
        submission.setAnswersJson(answersJson);
        submission.setAttemptedAt(now);
        submissionRepository.save(submission);

        // 8. Update employee skill proficiency according to verification policy
        Skill skill = assessment.getSkill();
        Optional<EmployeeSkill> existingSkillOpt = employeeSkillRepository
                .findByEmployeeProfileIdAndSkillId(employeeProfile.getId(), skill.getId());

        int assessedLevel = questions.stream()
                .mapToInt(AssessmentQuestion::getDifficultyLevel)
                .max()
                .orElse(1);

        VerificationStatus finalStatus = VerificationStatus.SELF_REPORTED;
        Integer finalVerifiedLevel = 1;

        if (existingSkillOpt.isPresent()) {
            EmployeeSkill es = existingSkillOpt.get();
            finalStatus = es.getVerificationStatus();
            finalVerifiedLevel = es.getVerifiedProficiencyLevel();

            if (passed) {
                // When passing, elevate verified level if assessed level is higher
                if (es.getVerifiedProficiencyLevel() < assessedLevel) {
                    es.setVerifiedProficiencyLevel(assessedLevel);
                    es.setVerificationStatus(VerificationStatus.ASSESSED);
                    es.setCurrentProficiencyLevel(Math.max(es.getCurrentProficiencyLevel(), assessedLevel));
                    finalVerifiedLevel = assessedLevel;
                    finalStatus = VerificationStatus.ASSESSED;
                } else {
                    // Preservation of higher verified proficiency:
                    if (es.getVerificationStatus() == VerificationStatus.SELF_REPORTED) {
                        es.setVerificationStatus(VerificationStatus.ASSESSED);
                    }
                    finalStatus = es.getVerificationStatus();
                    finalVerifiedLevel = es.getVerifiedProficiencyLevel();
                }
            } else {
                // Failing must NOT falsely increase or elevate proficiency
                finalStatus = es.getVerificationStatus();
                finalVerifiedLevel = es.getVerifiedProficiencyLevel();
            }
            es.setLastAssessedAt(now);
            employeeSkillRepository.save(es);
        } else {
            // New skill entry for employee
            EmployeeSkill es = new EmployeeSkill();
            es.setEmployeeProfile(employeeProfile);
            es.setSkill(skill);
            es.setLastAssessedAt(now);

            if (passed) {
                es.setCurrentProficiencyLevel(assessedLevel);
                es.setVerifiedProficiencyLevel(assessedLevel);
                es.setVerificationStatus(VerificationStatus.ASSESSED);
                finalVerifiedLevel = assessedLevel;
                finalStatus = VerificationStatus.ASSESSED;
            } else {
                es.setCurrentProficiencyLevel(1);
                es.setVerifiedProficiencyLevel(1);
                es.setVerificationStatus(VerificationStatus.SELF_REPORTED);
                finalVerifiedLevel = 1;
                finalStatus = VerificationStatus.SELF_REPORTED;
            }
            employeeSkillRepository.save(es);
        }

        // When diagnostic quiz is passed, promote any authentic certificate to CERTIFIED
        if (passed) {
            promoteCertificateToCertifiedIfEligible(employeeProfile, assessment);
        }

        // 9. Recommend relevant learning courses based on assessment results
        List<CourseRecommendationDto> recommendations = Collections.emptyList();
        try {
            recommendations = courseRecommendationService.generateCourseRecommendations(employeeProfile).stream()
                    .limit(3)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Could not generate course recommendations for profileId={}: {}", employeeProfile.getId(), e.getMessage());
        }

        // 10. Build response
        String feedbackMsg;
        if (passed) {
            feedbackMsg = String.format("Passed! You scored %s%% (required %s%%). %d/%d questions correct. Skill '%s' verified at Level %d.",
                    score, assessment.getPassingScore(), correctCount, questions.size(), skill.getName(), finalVerifiedLevel);
        } else {
            feedbackMsg = String.format("Did not meet passing score. You scored %s%% (required %s%%). %d/%d questions correct. Review the identified knowledge gaps below and recommended courses.",
                    score, assessment.getPassingScore(), correctCount, questions.size());
        }

        AssessmentResultDto result = new AssessmentResultDto();
        result.setSubmissionId(submission.getId());
        result.setAttemptId(attempt != null ? attempt.getId() : null);
        result.setAttemptNumber(attempt != null ? attempt.getAttemptNumber() : 1);
        result.setAssessmentId(assessment.getId());
        result.setAssessmentTitle(assessment.getTitle());
        result.setCourseId(assessment.getCourse() != null ? assessment.getCourse().getId() : null);
        result.setCourseTitle(assessment.getCourse() != null ? assessment.getCourse().getTitle() : null);
        result.setSkillId(skill.getId());
        result.setSkillName(skill.getName());
        result.setScore(score);
        result.setPassed(passed);
        result.setPassingScore(assessment.getPassingScore());
        result.setTotalQuestions(questions.size());
        result.setCorrectQuestions(correctCount);
        result.setAttemptedAt(now);
        result.setVerificationStatus(finalStatus);
        result.setVerifiedProficiencyLevel(finalVerifiedLevel);
        result.setFeedback(feedbackMsg);
        result.setQuestionFeedback(feedbackList);
        result.setKnowledgeGaps(knowledgeGaps);
        result.setRecommendedCourses(recommendations);

        log.info("Assessment submission processed for profileId={}, assessmentId={}, score={}, passed={}",
                employeeProfile.getId(), assessmentId, score, passed);

        // Notify connected mentors of mentee quiz attempt & incorrect answer topics
        try {
            notifyConnectedMentorsOfQuizResult(employeeProfile, assessment, score, passed, knowledgeGaps);
        } catch (Exception e) {
            log.warn("Could not notify mentors of quiz result for profileId={}: {}", employeeProfile.getId(), e.getMessage());
        }

        return result;
    }

    private void notifyConnectedMentorsOfQuizResult(
            EmployeeProfile menteeProfile,
            Assessment assessment,
            BigDecimal score,
            boolean passed,
            List<AssessmentKnowledgeGapDto> knowledgeGaps) {

        List<MentorAssignment> activeAssignments = mentorAssignmentRepository.findByMenteeId(menteeProfile.getId())
                .stream()
                .filter(ma -> ma.getStatus() == MentorAssignmentStatus.ACTIVE || ma.getStatus() == MentorAssignmentStatus.APPROVED_BY_MANAGER)
                .toList();

        if (activeAssignments.isEmpty()) {
            return;
        }

        List<String> weakTopics = knowledgeGaps.stream()
                .map(g -> g.getTopic() + " (" + (int)(100.0 - g.getMasteryPercentage()) + "% gap, missed " + g.getQuestionsMissed() + "/" + g.getQuestionsTested() + ")")
                .toList();

        String menteeName = menteeProfile.getUser().getFullName();
        String assessmentTitle = assessment.getTitle();
        String topicsText = weakTopics.isEmpty()
                ? "All tested topics passed (" + score + "% score)"
                : String.join("; ", weakTopics);

        for (MentorAssignment ma : activeAssignments) {
            if (ma.getMentor() == null || ma.getMentor().getUser() == null) {
                continue;
            }

            User mentorUser = ma.getMentor().getUser();

            // 1. Post automated message into the Mentorship Chat Thread
            String msgText = "Mentee Quiz Alert: " + menteeName + " attended '" + assessmentTitle + "' scoring " + score + "%." +
                    (weakTopics.isEmpty() 
                        ? " Great performance! No weak areas detected."
                        : " Incorrect answers / weak topics: " + topicsText + ". Recommend study materials or host a live session.");

            MentorshipMessage msg = new MentorshipMessage();
            msg.setMentorAssignment(ma);
            msg.setSender(menteeProfile.getUser());
            msg.setMessageText(msgText);
            msg.setSuggestionType(weakTopics.isEmpty() ? "NONE" : "QUIZ_ALERT");
            mentorshipMessageRepository.save(msg);

            // 2. Send Notification to Mentor Dashboard
            Notification notif = new Notification(
                    mentorUser,
                    "Quiz Alert: " + menteeName + " (" + score + "%)",
                    menteeName + " completed '" + assessmentTitle + "'. Weak topics identified: " + topicsText + ". Recommend materials or schedule a live session to support your mentee.",
                    "QUIZ_ALERT",
                    "/mentor",
                    assessment.getId(),
                    menteeProfile.getUser()
            );
            notificationRepository.save(notif);
        }
    }

    @Transactional(readOnly = true)
    public List<AssessmentHistoryDto> getOwnAssessmentHistory() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));
        return getHistoryForProfile(profile.getId());
    }

    @Transactional(readOnly = true)
    public List<AssessmentHistoryDto> getEmployeeAssessmentHistory(Long employeeProfileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        Long userDeptId = profile.getUser().getDepartment() != null ? profile.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(profile.getUser().getId(), userDeptId);

        return getHistoryForProfile(employeeProfileId);
    }

    @Transactional(readOnly = true)
    public List<AssessmentHistoryDto> getCourseAssessmentHistory(Long courseId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        List<AssessmentSubmission> submissions = submissionRepository.findByEmployeeProfileIdAndCourseIdOrderByAttemptedAtDesc(profile.getId(), courseId);
        return submissions.stream().map(this::toHistoryDto).collect(Collectors.toList());
    }

    private List<AssessmentHistoryDto> getHistoryForProfile(Long profileId) {
        List<AssessmentSubmission> submissions = submissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(profileId);
        return submissions.stream().map(this::toHistoryDto).collect(Collectors.toList());
    }

    private AssessmentHistoryDto toHistoryDto(AssessmentSubmission s) {
        return new AssessmentHistoryDto(
                s.getId(),
                s.getAssessment().getId(),
                s.getAssessment().getTitle(),
                s.getCourse() != null ? s.getCourse().getId() : null,
                s.getCourse() != null ? s.getCourse().getTitle() : null,
                s.getAttemptNumber() != null ? s.getAttemptNumber() : 1,
                s.getAssessment().getSkill().getId(),
                s.getAssessment().getSkill().getName(),
                s.getScore(),
                s.getPassed(),
                s.getAttemptedAt()
        );
    }

    private AssessmentSummaryDto toSummaryDto(Assessment a) {
        int count = (int) questionRepository.countByAssessmentId(a.getId());
        return new AssessmentSummaryDto(
                a.getId(),
                a.getTitle(),
                a.getSkill().getId(),
                a.getSkill().getName(),
                a.getPassingScore(),
                a.getTimeLimitMinutes(),
                a.getDescription(),
                count
        );
    }

    @Transactional
    public List<QuestionDto> generateQuestionsForCourse(Long courseId, int count) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
        Assessment assessment = getOrCreateAssessmentForCourse(courseId);
        List<AssessmentQuestion> questions = questionGeneratorService.generateAndSaveQuestionsForCourse(course, assessment, count);
        return questions.stream().map(q -> new QuestionDto(
                q.getId(),
                q.getQuestionText(),
                q.parseOptions(),
                q.getDifficultyLevel(),
                q.getTopic(),
                q.getEstimatedTimeSeconds() != null ? q.getEstimatedTimeSeconds() : 60
        )).collect(Collectors.toList());
    }

    @Transactional
    public List<QuestionDto> generateQuestionsForAssessment(Long assessmentId, int count) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", assessmentId));
        Course course = assessment.getCourse();
        if (course == null) {
            throw new BadRequestException("Assessment ID " + assessmentId + " is not mapped to a specific course.");
        }
        List<AssessmentQuestion> questions = questionGeneratorService.generateAndSaveQuestionsForCourse(course, assessment, count);
        return questions.stream().map(q -> new QuestionDto(
                q.getId(),
                q.getQuestionText(),
                q.parseOptions(),
                q.getDifficultyLevel(),
                q.getTopic(),
                q.getEstimatedTimeSeconds() != null ? q.getEstimatedTimeSeconds() : 60
        )).collect(Collectors.toList());
    }

    private void promoteCertificateToCertifiedIfEligible(EmployeeProfile profile, Assessment assessment) {
        if (profile == null || assessment == null) return;
        try {
            Course course = assessment.getCourse();
            List<CourseCertificate> certs = certificateRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
            String cTitle = course != null && course.getTitle() != null ? course.getTitle().trim().toLowerCase() : "";
            String aTitle = assessment.getTitle() != null ? assessment.getTitle().trim().toLowerCase() : "";
            String sName = assessment.getSkill() != null ? assessment.getSkill().getName().trim().toLowerCase() : "";
            for (CourseCertificate cert : certs) {
                String certTitle = cert.getCourseTitle() != null ? cert.getCourseTitle().trim().toLowerCase() : "";
                boolean titleMatches = (!cTitle.isEmpty() && (certTitle.equalsIgnoreCase(cTitle) || certTitle.contains(cTitle) || cTitle.contains(certTitle)))
                        || (!aTitle.isEmpty() && (certTitle.equalsIgnoreCase(aTitle) || certTitle.contains(aTitle) || aTitle.contains(certTitle)))
                        || (!sName.isEmpty() && (certTitle.contains(sName) || sName.contains(certTitle)));
                if (titleMatches) {
                    cert.setQuizPassed(true);
                    cert.setStatus("CERTIFIED");
                    cert.setVerifiedAt(OffsetDateTime.now());
                    certificateRepository.save(cert);
                    log.info("Promoted certificate id={} for profileId={} to CERTIFIED after passing diagnostic quiz", cert.getId(), profile.getId());
                    if (course != null) {
                        learningPathRepository.findByEmployeeProfileIdAndStatus(profile.getId(), "ACTIVE").ifPresent(path -> {
                            learningPathCourseRepository.findByLearningPathIdAndCourseId(path.getId(), course.getId()).ifPresent(lpc -> {
                                lpc.setStatus("COMPLETED");
                                lpc.setProgressPercentage(100);
                                lpc.setCompletedAt(OffsetDateTime.now());
                                learningPathCourseRepository.save(lpc);
                            });
                        });
                    }
                    List<CourseApprovalRequest> approvals = approvalRequestRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
                    for (CourseApprovalRequest req : approvals) {
                        String reqTitle = req.getExternalCourseTitle() != null ? req.getExternalCourseTitle().trim().toLowerCase() : "";
                        if (reqTitle.equalsIgnoreCase(certTitle) || reqTitle.contains(certTitle) || certTitle.contains(reqTitle)) {
                            if (req.getStatus() != CourseApprovalStatus.COMPLETED) {
                                req.setStatus(CourseApprovalStatus.COMPLETED);
                                approvalRequestRepository.save(req);
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not promote certificate to certified for profileId={}: {}", profile.getId(), ex.getMessage());
        }
    }
}
