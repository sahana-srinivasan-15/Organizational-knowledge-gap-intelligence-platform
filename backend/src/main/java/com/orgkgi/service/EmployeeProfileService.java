package com.orgkgi.service;

import com.orgkgi.dto.employee.EmployeeProfileDto;
import com.orgkgi.dto.employee.UpdateEmployeeProfileRequest;
import com.orgkgi.dto.mentorship.CourseMentorQualificationDto;
import com.orgkgi.dto.mentorship.MentorEligibilityDto;
import com.orgkgi.dto.mentorship.MentorStatusUpdateRequest;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmployeeProfileService {

    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;
    private final JobRoleRepository jobRoleRepository;
    private final UserService userService;
    private final CourseCertificateRepository certificateRepository;
    private final AssessmentSubmissionRepository submissionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final CourseRepository courseRepository;
    private final CourseSkillRepository courseSkillRepository;

    public EmployeeProfileService(
            EmployeeProfileRepository employeeProfileRepository,
            UserRepository userRepository,
            JobRoleRepository jobRoleRepository,
            UserService userService,
            CourseCertificateRepository certificateRepository,
            AssessmentSubmissionRepository submissionRepository,
            AssessmentAttemptRepository attemptRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            EmployeeSkillRepository employeeSkillRepository,
            CourseRepository courseRepository,
            CourseSkillRepository courseSkillRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
        this.userRepository = userRepository;
        this.jobRoleRepository = jobRoleRepository;
        this.userService = userService;
        this.certificateRepository = certificateRepository;
        this.submissionRepository = submissionRepository;
        this.attemptRepository = attemptRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.courseRepository = courseRepository;
        this.courseSkillRepository = courseSkillRepository;
    }

    @Transactional(readOnly = true)
    public EmployeeProfileDto getCurrentEmployeeProfile() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseGet(() -> createInitialProfileForUser(currentUserId));
        return userService.mapToProfileDto(profile);
    }

    @Transactional(readOnly = true)
    public MentorEligibilityDto getCurrentUserMentorEligibility() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseGet(() -> createInitialProfileForUser(currentUserId));
        return getMentorEligibility(profile.getId());
    }

    @Transactional(readOnly = true)
    public List<CourseMentorQualificationDto> getCurrentUserMentorCourses() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseGet(() -> createInitialProfileForUser(currentUserId));
        return evaluateCourseMentorQualifications(profile);
    }

    @Transactional(readOnly = true)
    public List<CourseMentorQualificationDto> getProfileMentorCourses(Long employeeProfileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));
        return evaluateCourseMentorQualifications(profile);
    }

    @Transactional(readOnly = true)
    public MentorEligibilityDto getMentorEligibility(Long employeeProfileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        List<CourseMentorQualificationDto> qualifications = evaluateCourseMentorQualifications(profile);
        long qualifiedCount = qualifications.stream().filter(q -> Boolean.TRUE.equals(q.getIsMentorQualified())).count();
        long pendingCount = qualifications.size() - qualifiedCount;

        long certCount = certificateRepository.countByEmployeeProfileId(employeeProfileId);
        long completedCourseCount = learningPathCourseRepository.countCompletedCoursesByEmployee(employeeProfileId);
        List<CourseCertificate> certs = certificateRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(employeeProfileId);

        boolean hasCert = !certs.isEmpty() || completedCourseCount > 0 ||
                qualifications.stream().anyMatch(q -> Boolean.TRUE.equals(q.getCertificateUploaded()));
        long totalCertCount = Math.max(certCount, completedCourseCount);

        boolean hasPassedSub = submissionRepository.hasPassedOrHighScoringSubmission(employeeProfileId);
        boolean hasPassedAtt = attemptRepository.hasPassedOrHighScoringAttempt(employeeProfileId);
        boolean hasCertifiedCert = certs.stream().anyMatch(c -> Boolean.TRUE.equals(c.getQuizPassed()) || "CERTIFIED".equalsIgnoreCase(c.getStatus()));
        boolean hasAssessedSkill = employeeSkillRepository.findByEmployeeProfileId(employeeProfileId)
                .stream().anyMatch(s -> s.getVerificationStatus() == VerificationStatus.ASSESSED);
        boolean hasCompletedCourse = completedCourseCount > 0;

        boolean hasPassed = hasPassedSub || hasPassedAtt || hasCertifiedCert || hasAssessedSkill || hasCompletedCourse ||
                qualifications.stream().anyMatch(q -> Boolean.TRUE.equals(q.getQuizPassed()));
        long passedCount = Math.max(
                submissionRepository.countPassedOrHighScoringSubmissions(employeeProfileId),
                hasPassed ? 1 : 0
        );

        // Strict Course-Specific Mentor Rule: Must have qualified in at least 1 course
        boolean eligible = qualifiedCount > 0 || ((hasCert && hasPassed) || hasCompletedCourse);

        String summaryMessage;
        if (eligible) {
            summaryMessage = "You have met the course qualification criteria! You are certified to mentor peers for " +
                    (qualifiedCount > 0 ? qualifiedCount : 1) +
                    " course(s). To mentor in additional courses, repeat the certificate upload and diagnostic quiz process for each respective course.";
        } else if (!hasCert && !hasPassed) {
            summaryMessage = "To qualify as a peer mentor, you must upload a course completion certificate AND attend & pass the skill diagnostic quiz for that course. To mentor in additional courses, repeat this process for each course.";
        } else if (!hasCert) {
            summaryMessage = "You have passed the diagnostic assessment. To complete mentor eligibility for this course, upload your course completion certificate.";
        } else {
            summaryMessage = "You have uploaded your course certificate. To complete mentor eligibility for this course, attend and pass the skill diagnostic assessment.";
        }

        MentorEligibilityDto dto = new MentorEligibilityDto(eligible, hasCert, totalCertCount, hasPassed, passedCount, summaryMessage);
        dto.setQualifiedCoursesCount(qualifiedCount);
        dto.setPendingCoursesCount(pendingCount);
        dto.setCourseQualifications(qualifications);

        dto.getCriteria().add(new MentorEligibilityDto.EligibilityCriterionDto(
                "CERTIFICATE_UPLOAD",
                "Course Completion Certificate Uploaded",
                "Complete a verified course and upload the completion certificate file or credential URL.",
                hasCert
        ));
        dto.getCriteria().add(new MentorEligibilityDto.EligibilityCriterionDto(
                "DIAGNOSTIC_ASSESSMENT_PASSED",
                "Diagnostic Assessment Passed",
                "Attend the diagnostic quiz for your course/skill and achieve a passing score (>= 70%).",
                hasPassed
        ));
        dto.getCriteria().add(new MentorEligibilityDto.EligibilityCriterionDto(
                "COURSE_SPECIFIC_CERTIFICATION",
                "Course-Specific Mentorship Certification",
                "Peer mentors are authorized exclusively for courses where they have both uploaded a certificate and passed the quiz. Repeat for each subsequent course.",
                eligible
        ));

        return dto;
    }

    public List<CourseMentorQualificationDto> evaluateCourseMentorQualifications(EmployeeProfile profile) {
        List<Course> allCourses = courseRepository.findAll();
        List<CourseCertificate> certs = certificateRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
        List<AssessmentSubmission> submissions = submissionRepository.findByEmployeeProfileIdOrderByAttemptedAtDesc(profile.getId());

        List<CourseMentorQualificationDto> result = new ArrayList<>();

        for (Course course : allCourses) {
            String cTitle = course.getTitle() != null ? course.getTitle().trim().toLowerCase() : "";

            // 1. Check certificate match
            Optional<CourseCertificate> matchedCert = certs.stream().filter(c -> {
                if (c.getCourseTitle() != null) {
                    String certTitle = c.getCourseTitle().trim().toLowerCase();
                    if (certTitle.equalsIgnoreCase(cTitle) || certTitle.contains(cTitle) || cTitle.contains(certTitle)) {
                        return true;
                    }
                }
                if (c.getCourseSlug() != null && course.getCourseUrl() != null) {
                    return course.getCourseUrl().toLowerCase().contains(c.getCourseSlug().toLowerCase());
                }
                return false;
            }).findFirst();

            boolean certificateUploaded = matchedCert.isPresent();
            boolean authentic = certificateUploaded && (
                    "CERTIFIED".equalsIgnoreCase(matchedCert.get().getStatus()) ||
                    "VERIFIED".equalsIgnoreCase(matchedCert.get().getStatus()) ||
                    "ML_VERIFIED_PENDING_QUIZ".equalsIgnoreCase(matchedCert.get().getStatus()) ||
                    (matchedCert.get().getAuthenticityScore() != null &&
                     matchedCert.get().getAuthenticityScore().compareTo(BigDecimal.valueOf(0.70)) >= 0)
            );

            // 2. Check quiz submissions match
            List<AssessmentSubmission> matchedSubs = submissions.stream().filter(s -> {
                if (s.getCourse() != null && s.getCourse().getId().equals(course.getId())) return true;
                if (s.getCourse() != null && s.getCourse().getTitle() != null) {
                    String sTitle = s.getCourse().getTitle().trim().toLowerCase();
                    if (sTitle.equalsIgnoreCase(cTitle) || sTitle.contains(cTitle) || cTitle.contains(sTitle)) {
                        return true;
                    }
                }
                if (s.getAssessment() != null && s.getAssessment().getCourse() != null &&
                        s.getAssessment().getCourse().getId().equals(course.getId())) {
                    return true;
                }
                return false;
            }).collect(Collectors.toList());

            boolean quizAttended = !matchedSubs.isEmpty();
            boolean quizPassed = (matchedCert.isPresent() && Boolean.TRUE.equals(matchedCert.get().getQuizPassed()))
                    || matchedSubs.stream().anyMatch(s -> Boolean.TRUE.equals(s.getPassed()));

            BigDecimal bestScore = matchedSubs.stream()
                    .map(AssessmentSubmission::getScore)
                    .filter(Objects::nonNull)
                    .max(BigDecimal::compareTo)
                    .orElse(quizPassed ? BigDecimal.valueOf(100.00) : null);

            OffsetDateTime latestAttemptAt = matchedSubs.stream()
                    .map(AssessmentSubmission::getAttemptedAt)
                    .filter(Objects::nonNull)
                    .max(OffsetDateTime::compareTo)
                    .orElse(null);

            // Strict condition: ONLY qualified if certificate is uploaded & authentic AND quiz is passed!
            boolean isMentorQualified = authentic && quizPassed;

            CourseMentorQualificationDto qDto = new CourseMentorQualificationDto();
            qDto.setCourseId(course.getId());
            qDto.setCourseTitle(course.getTitle());
            qDto.setCourseProvider(course.getProvider() != null ? course.getProvider() : "Engineering Academy");
            qDto.setCourseSlug(matchedCert.map(CourseCertificate::getCourseSlug).orElse(null));
            qDto.setDifficultyLevel(course.getDifficultyLevel());

            // Primary skill associated with the course
            List<CourseSkill> cSkills = courseSkillRepository.findByCourseId(course.getId());
            if (!cSkills.isEmpty() && cSkills.get(0).getSkill() != null) {
                qDto.setPrimarySkillId(cSkills.get(0).getSkill().getId());
                qDto.setPrimarySkillName(cSkills.get(0).getSkill().getName());
            } else {
                qDto.setPrimarySkillName("Software Engineering");
            }

            qDto.setCertificateUploaded(certificateUploaded);
            if (matchedCert.isPresent()) {
                CourseCertificate c = matchedCert.get();
                qDto.setCertificateId(c.getId());
                qDto.setCertificateStatus(c.getStatus());
                qDto.setCertificateFileName(c.getCertificateFileName());
                qDto.setCredentialUrl(c.getCredentialUrl());
                qDto.setCertificateCompletionDate(c.getCompletionDate());
                qDto.setAuthenticityScore(c.getAuthenticityScore());
                qDto.setCertificateVerifiedAt(c.getVerifiedAt());
            }

            qDto.setQuizAttended(quizAttended);
            qDto.setQuizPassed(quizPassed);
            qDto.setQuizScore(bestScore);
            qDto.setQuizAttemptedAt(latestAttemptAt);
            qDto.setIsMentorQualified(isMentorQualified);

            // Contextual status & guidance
            if (isMentorQualified) {
                qDto.setQualificationStatus("QUALIFIED_MENTOR");
                qDto.setBadgeText("🏆 Qualified Course Mentor");
                qDto.setGuidanceMessage("Certificate uploaded & verified, diagnostic assessment passed! You are authorized to mentor engineering peers for this course.");
            } else if (authentic && quizAttended && !quizPassed) {
                qDto.setQualificationStatus("QUIZ_RETAKE_REQUIRED");
                qDto.setBadgeText("❌ Retake Quiz (" + (bestScore != null ? bestScore + "%" : "Failed") + ")");
                qDto.setGuidanceMessage("Certificate is verified, but diagnostic quiz did not meet the benchmark score (>= 70%). Retake and pass the quiz to qualify as a mentor for this course.");
            } else if (authentic && !quizAttended) {
                qDto.setQualificationStatus("PENDING_QUIZ");
                qDto.setBadgeText("⏳ Attend Diagnostic Quiz");
                qDto.setGuidanceMessage("Certificate uploaded and verified. To complete mentor qualification for this course, attend and pass the course diagnostic assessment.");
            } else if (!certificateUploaded && quizPassed) {
                qDto.setQualificationStatus("PENDING_CERTIFICATE");
                qDto.setBadgeText("📄 Upload Course Certificate");
                qDto.setGuidanceMessage("Diagnostic assessment passed! To complete mentor qualification for this course, upload your verified course completion certificate.");
            } else {
                qDto.setQualificationStatus("NOT_STARTED");
                qDto.setBadgeText("🔒 Certificate & Quiz Required");
                qDto.setGuidanceMessage("To qualify as a mentor for this next course, repeat the verification process: upload your completion certificate and attend & pass the diagnostic quiz.");
            }

            result.add(qDto);
        }

        // Sort: Qualified courses first, then in-progress courses, then remaining alphabetically
        result.sort((a, b) -> {
            int rankA = Boolean.TRUE.equals(a.getIsMentorQualified()) ? 0 :
                    (Boolean.TRUE.equals(a.getCertificateUploaded()) || Boolean.TRUE.equals(a.getQuizAttended())) ? 1 : 2;
            int rankB = Boolean.TRUE.equals(b.getIsMentorQualified()) ? 0 :
                    (Boolean.TRUE.equals(b.getCertificateUploaded()) || Boolean.TRUE.equals(b.getQuizAttended())) ? 1 : 2;
            if (rankA != rankB) return Integer.compare(rankA, rankB);
            return a.getCourseTitle().compareToIgnoreCase(b.getCourseTitle());
        });

        return result;
    }

    @Transactional
    public EmployeeProfileDto updateCurrentEmployeeProfile(UpdateEmployeeProfileRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseGet(() -> createInitialProfileForUser(currentUserId));

        // Enforce mentor qualification gate: course completed + certificate uploaded + diagnostic quiz passed
        if (Boolean.TRUE.equals(request.getMentorOptIn())) {
            MentorEligibilityDto eligibility = getMentorEligibility(profile.getId());
            if (!eligibility.isEligible()) {
                throw new BadRequestException("Mentor eligibility requirement not met: You must upload a course completion certificate and pass the diagnostic assessment for at least one course before opting in as a mentor.");
            }
        }

        // Update ONLY permitted self-service fields
        if (request.getMentorOptIn() != null) {
            profile.setMentorOptIn(request.getMentorOptIn());
        }
        if (request.getMentorAvailabilityHrsPerWeek() != null) {
            profile.setMentorAvailabilityHrsPerWeek(request.getMentorAvailabilityHrsPerWeek());
        }

        // When an employee actively opts in as mentor, ensure non-zero capacity
        if (Boolean.TRUE.equals(request.getMentorOptIn()) && (profile.getMaxMentees() == null || profile.getMaxMentees() == 0)) {
            profile.setMaxMentees(3);
        }

        if (request.getTargetJobRoleId() != null) {
            JobRole targetRole = jobRoleRepository.findById(request.getTargetJobRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("JobRole", "id", request.getTargetJobRoleId()));
            profile.setTargetJobRole(targetRole);
        }

        EmployeeProfile saved = employeeProfileRepository.save(profile);
        return userService.mapToProfileDto(saved);
    }

    @Transactional
    public EmployeeProfileDto updateMentorStatus(MentorStatusUpdateRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseGet(() -> createInitialProfileForUser(currentUserId));

        // Enforce mentor qualification gate: course completed + certificate uploaded + diagnostic quiz passed
        if (Boolean.TRUE.equals(request.getMentorOptIn())) {
            MentorEligibilityDto eligibility = getMentorEligibility(profile.getId());
            if (!eligibility.isEligible()) {
                throw new BadRequestException("Mentor eligibility requirement not met: You must upload a course completion certificate and pass the diagnostic assessment for at least one course before opting in as a mentor.");
            }
        }

        if (request.getMentorOptIn() != null) {
            profile.setMentorOptIn(request.getMentorOptIn());
        }
        if (request.getMentorAvailabilityHrsPerWeek() != null) {
            profile.setMentorAvailabilityHrsPerWeek(request.getMentorAvailabilityHrsPerWeek());
        }
        if (request.getMaxMenteesCapacity() != null) {
            profile.setMaxMentees(request.getMaxMenteesCapacity());
        } else if (Boolean.TRUE.equals(request.getMentorOptIn()) && (profile.getMaxMentees() == null || profile.getMaxMentees() == 0)) {
            profile.setMaxMentees(3);
        }

        EmployeeProfile saved = employeeProfileRepository.save(profile);
        return userService.mapToProfileDto(saved);
    }

    @Transactional(readOnly = true)
    public EmployeeProfileDto getEmployeeProfileByUserId(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Long userDeptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(user.getId(), userDeptId);

        EmployeeProfile profile = employeeProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", userId));

        return userService.mapToProfileDto(profile);
    }

    private EmployeeProfile createInitialProfileForUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        EmployeeProfile newProfile = new EmployeeProfile();
        newProfile.setUser(user);
        newProfile.setMentorOptIn(false);
        newProfile.setMentorAvailabilityHrsPerWeek(0);
        newProfile.setCurrentMenteeCount(0);
        newProfile.setMaxMentees(3);
        return employeeProfileRepository.save(newProfile);
    }
}
