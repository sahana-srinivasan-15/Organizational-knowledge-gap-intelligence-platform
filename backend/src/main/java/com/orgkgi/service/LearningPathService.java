package com.orgkgi.service;

import com.orgkgi.dto.course.CourseRecommendationDto;
import com.orgkgi.dto.course.CourseSkillGainDto;
import com.orgkgi.dto.learningpath.LearningPathCourseDto;
import com.orgkgi.dto.learningpath.LearningPathDto;
import com.orgkgi.dto.skillgap.SkillGapItemDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LearningPathService {

    private static final Logger log = LoggerFactory.getLogger(LearningPathService.class);

    private final LearningPathRepository learningPathRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final CourseRepository courseRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final SkillGapService skillGapService;
    private final CourseRecommendationService courseRecommendationService;
    private final CourseCertificateRepository courseCertificateRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final CourseApprovalRequestRepository approvalRequestRepository;
    private final AssessmentSubmissionRepository assessmentSubmissionRepository;

    public LearningPathService(
            LearningPathRepository learningPathRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            CourseRepository courseRepository,
            CourseSkillRepository courseSkillRepository,
            EmployeeProfileRepository employeeProfileRepository,
            SkillGapService skillGapService,
            CourseRecommendationService courseRecommendationService,
            CourseCertificateRepository courseCertificateRepository,
            EmployeeSkillRepository employeeSkillRepository,
            CourseApprovalRequestRepository approvalRequestRepository,
            AssessmentSubmissionRepository assessmentSubmissionRepository) {
        this.learningPathRepository = learningPathRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.courseRepository = courseRepository;
        this.courseSkillRepository = courseSkillRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.skillGapService = skillGapService;
        this.courseRecommendationService = courseRecommendationService;
        this.courseCertificateRepository = courseCertificateRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.assessmentSubmissionRepository = assessmentSubmissionRepository;
    }

    @Transactional
    public LearningPathDto generateLearningPathForCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));
        return generateLearningPath(profile);
    }

    @Transactional
    public LearningPathDto generateLearningPathForEmployee(Long employeeProfileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        Long userDeptId = profile.getUser().getDepartment() != null ? profile.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(profile.getUser().getId(), userDeptId);

        return generateLearningPath(profile);
    }

    /**
     * Generates and persists a personalized learning pathway derived from the skill gap report
     * and course recommendations.
     */
    @Transactional
    public LearningPathDto generateLearningPath(EmployeeProfile profile) {
        JobRole targetRole = profile.getTargetJobRole();
        if (targetRole == null) {
            targetRole = profile.getCurrentJobRole();
        }
        if (targetRole == null) {
            throw new BadRequestException("Employee profile has no target or current job role assigned.");
        }

        List<String> uncoveredGaps = new ArrayList<>();
        List<Course> selectedCourses = selectCoursesForGapsAndRecommendations(profile, uncoveredGaps);

        // 4. Retire any existing ACTIVE learning path for this employee
        learningPathRepository.findByEmployeeProfileIdAndStatus(profile.getId(), "ACTIVE")
                .ifPresent(existingPath -> {
                    existingPath.setStatus("ABANDONED");
                    learningPathRepository.save(existingPath);
                });

        // 5. Create new LearningPath entity
        LearningPath learningPath = new LearningPath();
        learningPath.setEmployeeProfile(profile);
        learningPath.setTargetJobRole(targetRole);
        learningPath.setTitle(targetRole.getTitle() + " Upskilling Roadmap");
        learningPath.setStatus("ACTIVE");
        learningPath = learningPathRepository.save(learningPath);

        // 6. Persist learning path course steps
        List<LearningPathCourse> pathCourses = new ArrayList<>();
        int step = 1;
        for (Course course : selectedCourses) {
            LearningPathCourse lpc = new LearningPathCourse();
            lpc.setLearningPath(learningPath);
            lpc.setCourse(course);
            lpc.setStepOrder(step++);
            lpc.setStatus("NOT_STARTED");
            lpc.setProgressPercentage(0);
            pathCourses.add(learningPathCourseRepository.save(lpc));
        }

        learningPath.setLearningPathCourses(pathCourses);
        learningPath = learningPathRepository.save(learningPath);

        log.info("Generated learning path id={} with {} courses for profileId={}",
                learningPath.getId(), pathCourses.size(), profile.getId());

        return toDto(learningPath, pathCourses, uncoveredGaps);
    }

    private List<Course> selectCoursesForGapsAndRecommendations(EmployeeProfile profile, List<String> uncoveredGaps) {
        SkillGapReportDto gapReport = skillGapService.generateReport(profile);
        List<SkillGapItemDto> gaps = new ArrayList<>(gapReport.getSkillGaps().stream()
                .filter(g -> g.getRawGap() != null && g.getRawGap() > 0)
                .toList());

        gaps.sort(Comparator
                .comparing(SkillGapItemDto::getIsMandatory, Comparator.reverseOrder())
                .thenComparing(SkillGapItemDto::getImportanceWeight, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(SkillGapItemDto::getRawGap, Comparator.reverseOrder())
                .thenComparing(SkillGapItemDto::getSkillId)
        );

        List<CourseRecommendationDto> recommendations = courseRecommendationService.generateCourseRecommendations(profile);

        Set<Long> selectedCourseIds = new LinkedHashSet<>();
        List<Course> selectedCourses = new ArrayList<>();
        Set<Long> coveredSkillIds = new HashSet<>();

        for (SkillGapItemDto gap : gaps) {
            if (coveredSkillIds.contains(gap.getSkillId())) {
                continue;
            }

            final Long currentGapSkillId = gap.getSkillId();
            CourseRecommendationDto matchedCourse = null;
            for (CourseRecommendationDto rec : recommendations) {
                if (selectedCourseIds.contains(rec.getCourse().getId())) {
                    continue;
                }
                boolean coversThisSkill = rec.getCourse().getSkillsCovered().stream()
                        .anyMatch(s -> Objects.equals(s.getSkillId(), currentGapSkillId));
                if (coversThisSkill) {
                    matchedCourse = rec;
                    break;
                }
            }

            if (matchedCourse != null) {
                final Long courseId = matchedCourse.getCourse().getId();
                Course courseEntity = courseRepository.findById(courseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
                selectedCourseIds.add(courseEntity.getId());
                selectedCourses.add(courseEntity);

                for (CourseSkillGainDto sg : matchedCourse.getCourse().getSkillsCovered()) {
                    coveredSkillIds.add(sg.getSkillId());
                }
            } else if (uncoveredGaps != null) {
                uncoveredGaps.add(String.format("Skill '%s' (gap: %d, weight: %.2f, mandatory: %s) has no matching courses in the active course catalog.",
                        gap.getSkillName(), gap.getRawGap(), gap.getImportanceWeight(), gap.getIsMandatory()));
            }
        }

        if (selectedCourses.isEmpty() && recommendations != null && !recommendations.isEmpty()) {
            for (CourseRecommendationDto rec : recommendations) {
                if (selectedCourses.size() >= 3) break;
                if (rec.getCourse() != null && rec.getCourse().getId() != null) {
                    Course c = courseRepository.findById(rec.getCourse().getId()).orElse(null);
                    if (c != null && !selectedCourseIds.contains(c.getId())) {
                        selectedCourseIds.add(c.getId());
                        selectedCourses.add(c);
                    }
                }
            }
        }

        if (selectedCourses.isEmpty()) {
            List<Course> topCourses = courseRepository.findAll().stream()
                    .sorted(Comparator.comparing(Course::getRating, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(3)
                    .toList();
            for (Course tc : topCourses) {
                if (!selectedCourseIds.contains(tc.getId())) {
                    selectedCourseIds.add(tc.getId());
                    selectedCourses.add(tc);
                }
            }
        }

        return selectedCourses;
    }

    @Transactional
    public LearningPathDto getActiveLearningPathForCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));
        return getActiveLearningPathForProfile(profile.getId());
    }

    @Transactional
    public LearningPathDto getActiveLearningPathForEmployee(Long employeeProfileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        Long userDeptId = profile.getUser().getDepartment() != null ? profile.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(profile.getUser().getId(), userDeptId);

        return getActiveLearningPathForProfile(employeeProfileId);
    }

    @Transactional(readOnly = true)
    public LearningPathDto getLearningPathById(Long id) {
        LearningPath path = learningPathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPath", "id", id));

        EmployeeProfile profile = path.getEmployeeProfile();
        Long userDeptId = profile.getUser().getDepartment() != null ? profile.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(profile.getUser().getId(), userDeptId);

        List<LearningPathCourse> courses = learningPathCourseRepository.findByLearningPathIdWithCourse(id);
        return toDto(path, courses, Collections.emptyList());
    }

    /**
     * Updates valid learning progress for a specific course step in a learning path.
     * Enforces ownership boundary: only the path owner or ADMIN can update progress.
     */
    @Transactional
    public LearningPathDto updateCourseProgress(Long learningPathId, Long courseId, Integer progressPercentage) {
        if (progressPercentage == null || progressPercentage < 0 || progressPercentage > 100) {
            throw new BadRequestException("Progress percentage must be between 0 and 100.");
        }

        LearningPath path = learningPathRepository.findById(learningPathId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPath", "id", learningPathId));

        // Ownership authorization check
        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isOwner = Objects.equals(path.getEmployeeProfile().getUser().getId(), currentUserId);
        if (!isOwner && !SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("You are not authorized to update progress on another employee's learning path.");
        }

        LearningPathCourse lpc = learningPathCourseRepository.findByLearningPathIdAndCourseId(learningPathId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPathCourse", "courseId", courseId));

        lpc.setProgressPercentage(progressPercentage);
        if (progressPercentage == 100) {
            // Course can ONLY be COMPLETED if authentic certificate is uploaded AND diagnostic quiz is passed
            boolean hasAuthenticCert = courseCertificateRepository
                    .findByEmployeeProfileIdAndCourseTitleIgnoreCase(path.getEmployeeProfile().getId(), lpc.getCourse().getTitle())
                    .filter(c -> "CERTIFIED".equalsIgnoreCase(c.getStatus())
                            || "ML_VERIFIED_PENDING_QUIZ".equalsIgnoreCase(c.getStatus())
                            || (c.getAuthenticityScore() != null && c.getAuthenticityScore().compareTo(java.math.BigDecimal.valueOf(0.70)) >= 0))
                    .isPresent();

            boolean quizPassed = assessmentSubmissionRepository
                    .findByEmployeeProfileIdAndCourseIdOrderByAttemptedAtDesc(path.getEmployeeProfile().getId(), courseId)
                    .stream().anyMatch(s -> Boolean.TRUE.equals(s.getPassed()));

            if (hasAuthenticCert && quizPassed) {
                lpc.setStatus("COMPLETED");
                lpc.setCompletedAt(OffsetDateTime.now());
                elevateSkillsFromCompletedCourse(path.getEmployeeProfile(), lpc.getCourse());
                markCourseApprovalCompleted(path.getEmployeeProfile(), lpc.getCourse());
            } else {
                // Keep in progress / enrolled until both requirements are satisfied
                lpc.setStatus("IN_PROGRESS");
                lpc.setProgressPercentage(Math.min(progressPercentage, 90));
                lpc.setCompletedAt(null);
            }
        } else if (progressPercentage > 0) {
            lpc.setStatus("IN_PROGRESS");
            lpc.setCompletedAt(null);
        } else {
            lpc.setStatus("NOT_STARTED");
            lpc.setCompletedAt(null);
        }
        learningPathCourseRepository.save(lpc);

        // Check if all courses in the path are now COMPLETED
        List<LearningPathCourse> allCourses = learningPathCourseRepository.findByLearningPathIdWithCourse(learningPathId);
        boolean allCompleted = !allCourses.isEmpty() && allCourses.stream()
                .allMatch(c -> "COMPLETED".equalsIgnoreCase(c.getStatus()));

        if (allCompleted) {
            path.setStatus("COMPLETED");
            learningPathRepository.save(path);
        } else if ("COMPLETED".equalsIgnoreCase(path.getStatus())) {
            // Revert back to ACTIVE if a course progress was reduced
            path.setStatus("ACTIVE");
            learningPathRepository.save(path);
        }

        log.info("Updated progress for learningPathId={}, courseId={}, progress={}%",
                learningPathId, courseId, progressPercentage);

        return toDto(path, allCourses, Collections.emptyList());
    }

    @Transactional
    public LearningPathDto synchronizeActiveLearningPathForCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));
        return synchronizeActiveLearningPath(profile);
    }

    /**
     * Synchronizes the employee's active learning roadmap dynamically with their latest assessment
     * proficiency levels, course completion certificates, and approved course enrollments.
     */
    @Transactional
    public LearningPathDto synchronizeActiveLearningPath(EmployeeProfile profile) {
        LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(profile.getId(), "ACTIVE")
                .orElse(null);

        if (path == null) {
            // Auto-generate if no active path exists for this profile
            return generateLearningPath(profile);
        }

        List<LearningPathCourse> pathCourses = learningPathCourseRepository.findByLearningPathIdWithCourse(path.getId());

        if (pathCourses.isEmpty()) {
            List<Course> fallbackCourses = selectCoursesForGapsAndRecommendations(profile, new ArrayList<>());
            int step = 1;
            pathCourses = new ArrayList<>();
            for (Course course : fallbackCourses) {
                LearningPathCourse lpc = new LearningPathCourse();
                lpc.setLearningPath(path);
                lpc.setCourse(course);
                lpc.setStepOrder(step++);
                lpc.setStatus("NOT_STARTED");
                lpc.setProgressPercentage(0);
                pathCourses.add(learningPathCourseRepository.save(lpc));
            }
            path.setLearningPathCourses(pathCourses);
            learningPathRepository.save(path);
        }
        List<CourseCertificate> certs = courseCertificateRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
        List<CourseApprovalRequest> approvals = approvalRequestRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
        List<AssessmentSubmission> submissions = assessmentSubmissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(profile.getId());
        SkillGapReportDto gapReport = skillGapService.generateReport(profile);
        Map<Long, SkillGapItemDto> gapMap = gapReport.getSkillGaps().stream()
                .collect(Collectors.toMap(SkillGapItemDto::getSkillId, Function.identity(), (a, b) -> a));

        for (LearningPathCourse lpc : pathCourses) {
            Course course = lpc.getCourse();
            String cTitle = course.getTitle() != null ? course.getTitle().trim().toLowerCase() : "";

            // 1. Check if user holds an uploaded authentic completion certificate
            Optional<CourseCertificate> matchedCert = certs.stream().filter(c -> {
                String certTitle = c.getCourseTitle() != null ? c.getCourseTitle().trim().toLowerCase() : "";
                if (certTitle.isBlank() || cTitle.isBlank()) return false;
                return certTitle.equalsIgnoreCase(cTitle) || certTitle.contains(cTitle) || cTitle.contains(certTitle);
            }).findFirst();

            boolean hasAuthenticCert = matchedCert.isPresent() && (
                    "CERTIFIED".equalsIgnoreCase(matchedCert.get().getStatus())
                    || "ML_VERIFIED_PENDING_QUIZ".equalsIgnoreCase(matchedCert.get().getStatus())
                    || (matchedCert.get().getAuthenticityScore() != null && matchedCert.get().getAuthenticityScore().compareTo(java.math.BigDecimal.valueOf(0.70)) >= 0)
            );

            // 2. Check if diagnostic quiz was attended and passed
            boolean isQuizPassed = (matchedCert.isPresent() && Boolean.TRUE.equals(matchedCert.get().getQuizPassed()))
                    || submissions.stream().anyMatch(s -> {
                        if (!Boolean.TRUE.equals(s.getPassed())) return false;
                        if (s.getCourse() != null && s.getCourse().getId().equals(course.getId())) return true;
                        if (s.getCourse() != null && s.getCourse().getTitle() != null) {
                            String sTitle = s.getCourse().getTitle().trim().toLowerCase();
                            return sTitle.equalsIgnoreCase(cTitle) || sTitle.contains(cTitle) || cTitle.contains(sTitle);
                        }
                        return false;
                    });

            // Course is ONLY marked COMPLETED if BOTH authentic certificate AND passed quiz exist!
            boolean hasCertifiedAndQuiz = hasAuthenticCert && isQuizPassed;

            if (hasCertifiedAndQuiz) {
                // Ensure certificate is officially marked CERTIFIED
                if (matchedCert.isPresent()) {
                    CourseCertificate cert = matchedCert.get();
                    if (!Boolean.TRUE.equals(cert.getQuizPassed()) || !"CERTIFIED".equalsIgnoreCase(cert.getStatus())) {
                        cert.setQuizPassed(true);
                        cert.setStatus("CERTIFIED");
                        courseCertificateRepository.save(cert);
                    }
                }

                if (!"COMPLETED".equalsIgnoreCase(lpc.getStatus()) || lpc.getProgressPercentage() != 100) {
                    lpc.setStatus("COMPLETED");
                    lpc.setProgressPercentage(100);
                    if (lpc.getCompletedAt() == null) {
                        lpc.setCompletedAt(OffsetDateTime.now());
                    }
                    learningPathCourseRepository.save(lpc);

                    // Elevate skill proficiency for skills covered
                    elevateSkillsFromCompletedCourse(profile, course);
                }
            } else {
                // If either certificate or quiz is missing, course CANNOT be marked COMPLETED.
                // Revert any false COMPLETED state from prior auto-marking back to approved ENROLLED or NOT_STARTED.
                if ("COMPLETED".equalsIgnoreCase(lpc.getStatus())) {
                    boolean hasApprovedEnrollment = approvalRequestRepository
                            .findByEmployeeProfileIdAndStatusIn(profile.getId(),
                                    List.of(CourseApprovalStatus.APPROVED, CourseApprovalStatus.IN_PROGRESS))
                            .stream()
                            .anyMatch(r -> (r.getCourse() != null && Objects.equals(r.getCourse().getId(), course.getId()))
                                    || (r.getExternalCourseTitle() != null && course.getTitle() != null
                                        && r.getExternalCourseTitle().trim().equalsIgnoreCase(course.getTitle().trim())));

                    String revertStatus = hasApprovedEnrollment ? "ENROLLED" : (lpc.getProgressPercentage() != null && lpc.getProgressPercentage() > 0 ? "IN_PROGRESS" : "NOT_STARTED");
                    lpc.setStatus(revertStatus);
                    int revertProg = hasApprovedEnrollment ? 10 : (lpc.getProgressPercentage() != null && lpc.getProgressPercentage() < 100 && !"NOT_STARTED".equals(revertStatus) ? lpc.getProgressPercentage() : 0);
                    lpc.setProgressPercentage(revertProg);
                    lpc.setCompletedAt(null);
                    learningPathCourseRepository.save(lpc);
                } else if (lpc.getProgressPercentage() == null) {
                    lpc.setProgressPercentage(0);
                    lpc.setStatus("NOT_STARTED");
                    learningPathCourseRepository.save(lpc);
                }
            }
        }

        // Check overall completion
        boolean allCompleted = !pathCourses.isEmpty() && pathCourses.stream()
                .allMatch(c -> "COMPLETED".equalsIgnoreCase(c.getStatus()));

        if (allCompleted && !"COMPLETED".equalsIgnoreCase(path.getStatus())) {
            path.setStatus("COMPLETED");
            learningPathRepository.save(path);
        } else if (!allCompleted && !"ACTIVE".equalsIgnoreCase(path.getStatus())) {
            path.setStatus("ACTIVE");
            learningPathRepository.save(path);
        }

        log.info("Synchronized learning path id={} for profileId={}: allCompleted={}",
                path.getId(), profile.getId(), allCompleted);

        return toDto(path, pathCourses, Collections.emptyList());
    }

    public void elevateSkillsFromCompletedCourse(EmployeeProfile profile, Course course) {
        if (profile == null || course == null) return;
        List<CourseSkill> courseSkills = courseSkillRepository.findByCourseId(course.getId());
        OffsetDateTime now = OffsetDateTime.now();

        for (CourseSkill cs : courseSkills) {
            Skill skill = cs.getSkill();
            if (skill == null) continue;

            int targetGain = cs.getTargetProficiencyGain() != null ? cs.getTargetProficiencyGain() : 1;
            int courseMinLevel = Math.max(1, Math.min(5, course.getDifficultyNumeric() + targetGain));

            Optional<EmployeeSkill> existingOpt = employeeSkillRepository
                    .findByEmployeeProfileIdAndSkillId(profile.getId(), skill.getId());

            if (existingOpt.isPresent()) {
                EmployeeSkill es = existingOpt.get();
                int currentVerified = es.getVerifiedProficiencyLevel() != null ? es.getVerifiedProficiencyLevel() : 1;
                int newVerified = Math.max(currentVerified, Math.min(5, currentVerified + targetGain));
                es.setVerifiedProficiencyLevel(newVerified);
                es.setCurrentProficiencyLevel(Math.max(es.getCurrentProficiencyLevel(), newVerified));
                es.setVerificationStatus(VerificationStatus.ASSESSED);
                es.setLastAssessedAt(now);
                employeeSkillRepository.save(es);
            } else {
                EmployeeSkill es = new EmployeeSkill();
                es.setEmployeeProfile(profile);
                es.setSkill(skill);
                es.setCurrentProficiencyLevel(courseMinLevel);
                es.setVerifiedProficiencyLevel(courseMinLevel);
                es.setVerificationStatus(VerificationStatus.ASSESSED);
                es.setLastAssessedAt(now);
                employeeSkillRepository.save(es);
            }
        }
    }

    public void markCourseApprovalCompleted(EmployeeProfile profile, Course course) {
        if (profile == null || course == null) return;
        List<CourseApprovalRequest> requests = approvalRequestRepository
                .findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());

        String cTitle = course.getTitle() != null ? course.getTitle().trim().toLowerCase() : "";
        for (CourseApprovalRequest r : requests) {
            String rTitle = r.getExternalCourseTitle() != null ? r.getExternalCourseTitle().trim().toLowerCase() : "";
            if (rTitle.equalsIgnoreCase(cTitle) || (r.getCourse() != null && r.getCourse().getId().equals(course.getId()))) {
                if (r.getStatus() != CourseApprovalStatus.COMPLETED) {
                    r.setStatus(CourseApprovalStatus.COMPLETED);
                    approvalRequestRepository.save(r);
                }
            }
        }
    }

    private LearningPathDto getActiveLearningPathForProfile(Long profileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", profileId));

        return synchronizeActiveLearningPath(profile);
    }

    private LearningPathDto toDto(LearningPath path, List<LearningPathCourse> courses, List<String> uncoveredGaps) {
        int totalCourses = courses.size();
        int completedCourses = (int) courses.stream().filter(c -> "COMPLETED".equalsIgnoreCase(c.getStatus())).count();
        int overallProgress = totalCourses > 0
                ? (int) Math.round(courses.stream().mapToInt(LearningPathCourse::getProgressPercentage).average().orElse(0.0))
                : 0;

        List<CourseCertificate> certs = path.getEmployeeProfile() != null
                ? courseCertificateRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(path.getEmployeeProfile().getId())
                : Collections.emptyList();
        List<AssessmentSubmission> submissions = path.getEmployeeProfile() != null
                ? assessmentSubmissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(path.getEmployeeProfile().getId())
                : Collections.emptyList();

        List<LearningPathCourseDto> courseDtos = courses.stream().map(c -> {
            String title = c.getCourse().getTitle() != null ? c.getCourse().getTitle().trim().toLowerCase() : "";
            Optional<CourseCertificate> matchedCert = certs.stream()
                    .filter(cert -> {
                        String ct = cert.getCourseTitle() != null ? cert.getCourseTitle().trim().toLowerCase() : "";
                        return !ct.isEmpty() && (ct.equalsIgnoreCase(title) || ct.contains(title) || title.contains(ct));
                    })
                    .findFirst();

            boolean hasUploadedCert = matchedCert.isPresent();
            String certStatus = matchedCert.map(CourseCertificate::getStatus).orElse(null);
            boolean quizPassed = matchedCert.map(cert -> Boolean.TRUE.equals(cert.getQuizPassed())).orElse(false)
                    || submissions.stream().anyMatch(s -> {
                        if (!Boolean.TRUE.equals(s.getPassed())) return false;
                        if (s.getCourse() != null && s.getCourse().getId().equals(c.getCourse().getId())) return true;
                        if (s.getCourse() != null && s.getCourse().getTitle() != null) {
                            String sTitle = s.getCourse().getTitle().trim().toLowerCase();
                            return sTitle.equalsIgnoreCase(title) || sTitle.contains(title) || title.contains(sTitle);
                        }
                        return false;
                    });

            LearningPathCourseDto cdto = new LearningPathCourseDto(
                    c.getId(),
                    c.getCourse().getId(),
                    c.getCourse().getTitle(),
                    c.getCourse().getProvider(),
                    c.getCourse().getDurationHours(),
                    c.getCourse().getDifficultyLevel(),
                    c.getCourse().getRating(),
                    c.getStepOrder(),
                    c.getStatus(),
                    c.getProgressPercentage(),
                    c.getCompletedAt(),
                    hasUploadedCert
            );
            cdto.setCertificateStatus(certStatus);
            cdto.setQuizPassed(quizPassed);
            if (c.getCourse() != null) {
                cdto.setCourseUrl(c.getCourse().getCourseUrl());
            }
            return cdto;
        }).collect(Collectors.toList());

        String employeeName = path.getEmployeeProfile().getUser().getFullName();
        String roleTitle = path.getTargetJobRole() != null ? path.getTargetJobRole().getTitle() : "Unassigned Role";
        Long roleId = path.getTargetJobRole() != null ? path.getTargetJobRole().getId() : null;

        LearningPathDto dto = new LearningPathDto();
        dto.setId(path.getId());
        dto.setEmployeeProfileId(path.getEmployeeProfile().getId());
        dto.setEmployeeName(employeeName);
        dto.setTargetJobRoleId(roleId);
        dto.setTargetJobRoleTitle(roleTitle);
        dto.setTitle(path.getTitle());
        dto.setStatus(path.getStatus());
        dto.setTotalCourses(totalCourses);
        dto.setCompletedCourses(completedCourses);
        dto.setOverallProgressPercentage(overallProgress);
        dto.setCourses(courseDtos);
        dto.setUncoveredSkillGaps(uncoveredGaps);
        dto.setCreatedAt(path.getCreatedAt());
        dto.setUpdatedAt(path.getUpdatedAt());

        return dto;
    }
}
