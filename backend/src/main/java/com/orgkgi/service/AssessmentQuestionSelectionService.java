package com.orgkgi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.dto.assessment.QuestionDto;
import com.orgkgi.entity.Assessment;
import com.orgkgi.entity.AssessmentAttempt;
import com.orgkgi.entity.AssessmentQuestion;
import com.orgkgi.entity.Course;
import com.orgkgi.repository.AssessmentAttemptRepository;
import com.orgkgi.repository.AssessmentQuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssessmentQuestionSelectionService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentQuestionSelectionService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static final int DEFAULT_ASSESSMENT_LENGTH = 5;

    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final CourseQuestionGeneratorService questionGeneratorService;

    public AssessmentQuestionSelectionService(
            AssessmentQuestionRepository questionRepository,
            AssessmentAttemptRepository attemptRepository,
            CourseQuestionGeneratorService questionGeneratorService) {
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.questionGeneratorService = questionGeneratorService;
    }

    /**
     * Dynamically selects and randomizes questions and options for an assessment attempt.
     */
    @Transactional
    public SelectedQuestionBundle selectQuestionsForAttempt(
            Long employeeProfileId,
            Assessment assessment,
            Course course,
            int requestedCount) {
        return selectQuestionsForAttempt(employeeProfileId, assessment, course, requestedCount, false);
    }

    /**
     * Dynamically selects and randomizes questions and options for an assessment attempt.
     * When enforceDiagnosticDistribution is true, guarantees minimum 5 questions with:
     * - 1 Easy (Level 1)
     * - 2 Medium (Level 2)
     * - 2 Hard (Level 3)
     * and strictly guarantees that the employee receives fresh, UNSEEN questions on every attempt / retake
     * by dynamically generating novel course-specific questions whenever unseen quotas are insufficient.
     */
    @Transactional
    public SelectedQuestionBundle selectQuestionsForAttempt(
            Long employeeProfileId,
            Assessment assessment,
            Course course,
            int requestedCount,
            boolean enforceDiagnosticDistribution) {

        Long assessmentId = assessment != null ? assessment.getId() : null;
        Long courseId = course != null ? course.getId() : null;

        // 1. Retrieve all candidate questions for this course / assessment from repository
        List<AssessmentQuestion> pool = new ArrayList<>();
        if (courseId != null && assessmentId != null) {
            pool = questionRepository.findByAssessmentIdOrCourseIdOrderByIdAsc(assessmentId, courseId);
        } else if (courseId != null) {
            pool = questionRepository.findByCourseIdOrderByIdAsc(courseId);
        } else if (assessmentId != null) {
            pool = questionRepository.findByAssessmentIdOrderByIdAsc(assessmentId);
        }

        // Deduplicate pool by question ID
        Map<Long, AssessmentQuestion> uniquePoolMap = new LinkedHashMap<>();
        for (AssessmentQuestion q : pool) {
            uniquePoolMap.put(q.getId(), q);
        }
        List<AssessmentQuestion> uniquePool = new ArrayList<>(uniquePoolMap.values());

        // 2. Identify all question IDs previously seen/answered by this employee to prevent repetitions
        Set<Long> seenQuestionIds = new HashSet<>();
        if (employeeProfileId != null) {
            List<AssessmentAttempt> previousAttempts = (courseId != null)
                    ? attemptRepository.findByEmployeeProfileIdAndCourseIdOrderByAttemptNumberDesc(employeeProfileId, courseId)
                    : attemptRepository.findByEmployeeProfileIdAndAssessmentIdOrderByAttemptNumberDesc(employeeProfileId, assessmentId);

            for (AssessmentAttempt att : previousAttempts) {
                seenQuestionIds.addAll(att.parseQuestionIds());
            }
        }

        // Collect existing question texts currently in the pool to pass to generator
        Set<String> existingQuestionTexts = uniquePool.stream()
                .map(AssessmentQuestion::getQuestionText)
                .filter(Objects::nonNull)
                .map(String::trim)
                .collect(Collectors.toSet());

        // 3. Count available UNSEEN questions per difficulty level for this employee
        List<AssessmentQuestion> unseenQuestions = uniquePool.stream()
                .filter(q -> !seenQuestionIds.contains(q.getId()))
                .collect(Collectors.toList());

        long unseenEasy = unseenQuestions.stream().filter(q -> q.getDifficultyLevel() != null && q.getDifficultyLevel() <= 1).count();
        long unseenMedium = unseenQuestions.stream().filter(q -> q.getDifficultyLevel() != null && q.getDifficultyLevel() == 2).count();
        long unseenHard = unseenQuestions.stream().filter(q -> q.getDifficultyLevel() != null && q.getDifficultyLevel() >= 3).count();

        // 4. Dynamic question generation:
        // - If pool is completely empty, ALWAYS generate questions
        // - If enforceDiagnosticDistribution is true, ensure employee has at least 1 unseen Easy, 2 unseen Medium, and 2 unseen Hard
        boolean hasSufficientUnseenQuotas = unseenQuestions.size() >= DEFAULT_ASSESSMENT_LENGTH
                && unseenEasy >= 1
                && unseenMedium >= 2
                && unseenHard >= 2;

        boolean needsGeneration = uniquePool.isEmpty();
        if (enforceDiagnosticDistribution && course != null && assessment != null) {
            if (!hasSufficientUnseenQuotas) {
                needsGeneration = true;
            }
        }

        if (needsGeneration && course != null && assessment != null) {
            log.info("Generating fresh unseen questions for employeeProfileId={} courseId={} (Current unseen: Total={}, E={}, M={}, H={})",
                    employeeProfileId, course.getId(), unseenQuestions.size(), unseenEasy, unseenMedium, unseenHard);
            List<AssessmentQuestion> generated = questionGeneratorService.generateAndSaveQuestionsForCourse(
                    course, assessment, DEFAULT_ASSESSMENT_LENGTH, existingQuestionTexts);
            for (AssessmentQuestion gq : generated) {
                if (!uniquePoolMap.containsKey(gq.getId())) {
                    uniquePoolMap.put(gq.getId(), gq);
                }
            }
            uniquePool = new ArrayList<>(uniquePoolMap.values());
        }

        if (uniquePool.isEmpty()) {
            log.warn("No questions available for assessmentId={} courseId={}", assessmentId, courseId);
            return new SelectedQuestionBundle(Collections.emptyList(), Collections.emptyList(), Collections.emptyMap(), "{}");
        }

        int targetCount = Math.min(requestedCount > 0 ? requestedCount : DEFAULT_ASSESSMENT_LENGTH, uniquePool.size());

        // 5. Select questions strictly prioritizing unseen questions with 1 Easy, 2 Medium, 2 Hard distribution
        List<AssessmentQuestion> selectedQuestions = selectBalancedQuestionsByDifficulty(uniquePool, seenQuestionIds, targetCount);

        // 5. Randomize answer options order while tracking the server-side correct index
        List<QuestionDto> displayQuestions = new ArrayList<>();
        List<Long> questionIds = new ArrayList<>();
        Map<Long, Integer> correctOptionIndexMap = new HashMap<>(); // questionId -> new correct index in randomized display
        Map<String, Object> optionsShuffledMetadata = new HashMap<>();

        for (AssessmentQuestion q : selectedQuestions) {
            questionIds.add(q.getId());
            List<String> originalOptions = q.parseOptions();
            int originalCorrectIdx = q.getCorrectOptionIndex();
            String correctOptionText = (originalCorrectIdx >= 0 && originalCorrectIdx < originalOptions.size())
                    ? originalOptions.get(originalCorrectIdx)
                    : null;

            // Create shuffled copy of options
            List<String> shuffledOptions = new ArrayList<>(originalOptions);
            Collections.shuffle(shuffledOptions);

            int newCorrectIdx = correctOptionText != null ? shuffledOptions.indexOf(correctOptionText) : originalCorrectIdx;
            if (newCorrectIdx < 0) newCorrectIdx = 0;

            correctOptionIndexMap.put(q.getId(), newCorrectIdx);

            Map<String, Object> qMeta = new HashMap<>();
            qMeta.put("originalCorrectIndex", originalCorrectIdx);
            qMeta.put("shuffledCorrectIndex", newCorrectIdx);
            qMeta.put("shuffledOptions", shuffledOptions);
            optionsShuffledMetadata.put(String.valueOf(q.getId()), qMeta);

            // Client gets sanitized DTO without answer keys or explanation
            displayQuestions.add(new QuestionDto(
                    q.getId(),
                    q.getQuestionText(),
                    shuffledOptions,
                    q.getDifficultyLevel(),
                    q.getTopic(),
                    q.getEstimatedTimeSeconds()
            ));
        }

        String optionsShuffledJson = "{}";
        try {
            optionsShuffledJson = MAPPER.writeValueAsString(optionsShuffledMetadata);
        } catch (Exception e) {
            log.error("Failed to serialize options shuffled metadata", e);
        }

        return new SelectedQuestionBundle(displayQuestions, questionIds, correctOptionIndexMap, optionsShuffledJson);
    }

    /**
     * Balances questions according to user requirements: 1 Easy (Level 1), 2 Medium (Level 2), 2 Hard (Level 3).
     * Falls back to general pool if a specific tier has fewer questions.
     */
    private List<AssessmentQuestion> selectBalancedQuestionsByDifficulty(
            List<AssessmentQuestion> pool,
            Set<Long> recentQuestionIds,
            int targetCount) {

        List<AssessmentQuestion> easyPool = new ArrayList<>();
        List<AssessmentQuestion> mediumPool = new ArrayList<>();
        List<AssessmentQuestion> hardPool = new ArrayList<>();

        for (AssessmentQuestion q : pool) {
            int d = q.getDifficultyLevel() != null ? q.getDifficultyLevel() : 1;
            if (d <= 1) easyPool.add(q);
            else if (d == 2) mediumPool.add(q);
            else hardPool.add(q);
        }

        Comparator<AssessmentQuestion> unseenFirst = Comparator.comparing(q -> recentQuestionIds.contains(q.getId()));
        Collections.shuffle(easyPool);
        easyPool.sort(unseenFirst);

        Collections.shuffle(mediumPool);
        mediumPool.sort(unseenFirst);

        Collections.shuffle(hardPool);
        hardPool.sort(unseenFirst);

        List<AssessmentQuestion> selected = new ArrayList<>();

        // Allocate required distribution: 1 Easy, 2 Medium, 2 Hard
        int neededEasy = targetCount >= 5 ? 1 : Math.max(1, targetCount / 3);
        int neededMedium = targetCount >= 5 ? 2 : Math.max(1, targetCount / 2);
        int neededHard = targetCount >= 5 ? 2 : Math.max(1, targetCount - neededEasy - neededMedium);

        for (AssessmentQuestion q : easyPool) {
            if (neededEasy <= 0) break;
            selected.add(q);
            neededEasy--;
        }

        for (AssessmentQuestion q : mediumPool) {
            if (neededMedium <= 0) break;
            selected.add(q);
            neededMedium--;
        }

        for (AssessmentQuestion q : hardPool) {
            if (neededHard <= 0) break;
            selected.add(q);
            neededHard--;
        }

        // Backfill if any tier lacked sufficient questions
        if (selected.size() < targetCount) {
            List<AssessmentQuestion> remainingPool = new ArrayList<>(pool);
            Collections.shuffle(remainingPool);
            remainingPool.sort(unseenFirst);

            for (AssessmentQuestion q : remainingPool) {
                if (selected.size() >= targetCount) break;
                if (!selected.contains(q)) {
                    selected.add(q);
                }
            }
        }

        // Present questions in pedagogical order: Level 1 (Easy) -> Level 2 (Medium) -> Level 3 (Hard)
        selected.sort(Comparator.comparingInt(q -> q.getDifficultyLevel() != null ? q.getDifficultyLevel() : 1));

        return selected;
    }

    public static class SelectedQuestionBundle {
        private final List<QuestionDto> displayQuestions;
        private final List<Long> questionIds;
        private final Map<Long, Integer> correctOptionIndexMap;
        private final String optionsShuffledJson;

        public SelectedQuestionBundle(
                List<QuestionDto> displayQuestions,
                List<Long> questionIds,
                Map<Long, Integer> correctOptionIndexMap,
                String optionsShuffledJson) {
            this.displayQuestions = displayQuestions;
            this.questionIds = questionIds;
            this.correctOptionIndexMap = correctOptionIndexMap;
            this.optionsShuffledJson = optionsShuffledJson;
        }

        public List<QuestionDto> getDisplayQuestions() { return displayQuestions; }
        public List<Long> getQuestionIds() { return questionIds; }
        public Map<Long, Integer> getCorrectOptionIndexMap() { return correctOptionIndexMap; }
        public String getOptionsShuffledJson() { return optionsShuffledJson; }
    }
}
