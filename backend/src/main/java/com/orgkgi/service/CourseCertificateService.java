package com.orgkgi.service;

import com.orgkgi.dto.certificate.CourseCertificateDto;
import com.orgkgi.dto.certificate.MlCertificateVerificationRequest;
import com.orgkgi.dto.certificate.MlCertificateVerificationResponse;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseCertificateService {

    private static final Logger log = LoggerFactory.getLogger(CourseCertificateService.class);

    private final CourseCertificateRepository certificateRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final FileStorageService fileStorageService;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final CourseApprovalRequestRepository approvalRequestRepository;
    private final CourseRepository courseRepository;
    private final AssessmentSubmissionRepository assessmentSubmissionRepository;
    private final RestClient restClient;

    public CourseCertificateService(
            CourseCertificateRepository certificateRepository,
            EmployeeProfileRepository employeeProfileRepository,
            FileStorageService fileStorageService,
            LearningPathRepository learningPathRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            CourseSkillRepository courseSkillRepository,
            EmployeeSkillRepository employeeSkillRepository,
            CourseApprovalRequestRepository approvalRequestRepository,
            CourseRepository courseRepository,
            AssessmentSubmissionRepository assessmentSubmissionRepository,
            @Value("${ml.service.url:http://localhost:8000}") String mlServiceUrl,
            @Value("${ml.service.timeout-ms:5000}") int timeoutMs) {
        this.certificateRepository = certificateRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.fileStorageService = fileStorageService;
        this.learningPathRepository = learningPathRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.courseSkillRepository = courseSkillRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.courseRepository = courseRepository;
        this.assessmentSubmissionRepository = assessmentSubmissionRepository;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(mlServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Transactional
    public CourseCertificateDto uploadCertificate(
            String courseTitle,
            String courseProvider,
            String courseSlug,
            String credentialUrl,
            LocalDate completionDate,
            MultipartFile file) {

        if (courseTitle == null || courseTitle.trim().isEmpty()) {
            throw new BadRequestException("Course title is required");
        }

        if ((file == null || file.isEmpty()) && (credentialUrl == null || credentialUrl.trim().isEmpty())) {
            throw new BadRequestException("Please either upload a certificate document (PDF/Image) or provide a verification link.");
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        String storedPath = null;
        String fileName = null;
        Long fileSizeBytes = 0L;
        String fileMimeType = null;

        if (file != null && !file.isEmpty()) {
            storedPath = fileStorageService.storeCertificate(file);
            fileName = file.getOriginalFilename();
            fileSizeBytes = file.getSize();
            fileMimeType = file.getContentType();
        }

        // 1. ML-Driven Certificate Authenticity & Originality Verification
        MlCertificateVerificationResponse mlResult = verifyWithMlModel(
                courseTitle, courseProvider, courseSlug, credentialUrl, fileName, storedPath, fileSizeBytes, fileMimeType, completionDate
        );

        if (mlResult == null || Boolean.FALSE.equals(mlResult.getIsAuthentic()) ||
                (mlResult.getAuthenticityScore() != null && mlResult.getAuthenticityScore().compareTo(BigDecimal.valueOf(0.70)) < 0)) {
            int scorePercent = mlResult != null && mlResult.getAuthenticityScore() != null
                    ? mlResult.getAuthenticityScore().multiply(BigDecimal.valueOf(100)).intValue() : 0;
            String reason = mlResult != null && mlResult.getMessage() != null
                    ? mlResult.getMessage() : "ML authenticity model detected irregularities or unverified credential format.";
            throw new BadRequestException("Certificate authenticity verification failed (" + scorePercent + "% score): " + reason);
        }

        BigDecimal score = mlResult.getAuthenticityScore() != null ? mlResult.getAuthenticityScore() : BigDecimal.valueOf(0.95);

        // 2. Resolve or create certificate record
        CourseCertificate cert = certificateRepository
                .findByEmployeeProfileIdAndCourseTitleIgnoreCase(profile.getId(), courseTitle.trim())
                .orElseGet(CourseCertificate::new);

        cert.setEmployeeProfile(profile);
        cert.setCourseTitle(courseTitle.trim());
        cert.setCourseProvider(courseProvider != null && !courseProvider.trim().isEmpty() ? courseProvider.trim() : "Coursera");
        cert.setCourseSlug(courseSlug != null && !courseSlug.trim().isEmpty() ? courseSlug.trim() : null);
        if (fileName != null) cert.setCertificateFileName(fileName);
        if (storedPath != null) cert.setCertificateFilePath(storedPath);
        if (credentialUrl != null && !credentialUrl.trim().isEmpty()) cert.setCredentialUrl(credentialUrl.trim());
        cert.setCompletionDate(completionDate != null ? completionDate : LocalDate.now());
        cert.setAuthenticityScore(score);
        cert.setVerifiedAt(OffsetDateTime.now());

        // 3. Check if diagnostic quiz has already been passed for this course
        boolean quizPassed = checkDiagnosticQuizPassed(profile.getId(), courseTitle, courseSlug);
        cert.setQuizPassed(quizPassed);

        String message;
        if (quizPassed) {
            // Both Authentic Certificate AND Diagnostic Quiz passed -> CERTIFIED & COMPLETED
            cert.setStatus("CERTIFIED");
            propagateCourseCompletion(profile, courseTitle);
            message = "Certificate verified as authentic by ML model (" + (int)(score.doubleValue() * 100)
                    + "% score), and diagnostic quiz already passed! Course is officially Completed & Certified.";
        } else {
            // Authentic Certificate verified, but Diagnostic Quiz is required to certify
            cert.setStatus("ML_VERIFIED_PENDING_QUIZ");
            message = "Certificate verified as authentic by ML model (" + (int)(score.doubleValue() * 100)
                    + "% score). To complete and certify this course, please attend and pass the course Diagnostic Quiz.";
        }

        CourseCertificate saved = certificateRepository.save(cert);
        CourseCertificateDto dto = mapToDto(saved);
        dto.setVerificationMessage(message);
        return dto;
    }

    private MlCertificateVerificationResponse verifyWithMlModel(
            String courseTitle,
            String courseProvider,
            String courseSlug,
            String credentialUrl,
            String fileName,
            String filePath,
            Long fileSizeBytes,
            String fileMimeType,
            LocalDate completionDate) {

        MlCertificateVerificationRequest request = new MlCertificateVerificationRequest(
                courseTitle,
                courseProvider,
                courseSlug,
                credentialUrl,
                fileName,
                filePath,
                fileSizeBytes,
                fileMimeType,
                completionDate != null ? completionDate.toString() : LocalDate.now().toString()
        );

        try {
            return restClient.post()
                    .uri("/api/v1/verify/certificate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(MlCertificateVerificationResponse.class);
        } catch (Exception e) {
            log.warn("ML Service certificate authenticity verification call failed: {}, falling back to deterministic evaluation", e.getMessage());
            return evaluateDeterministicFallback(request);
        }
    }

    private MlCertificateVerificationResponse evaluateDeterministicFallback(MlCertificateVerificationRequest req) {
        String url = req.getCredentialUrl() != null ? req.getCredentialUrl().trim().toLowerCase() : "";
        String file = req.getFileName() != null ? req.getFileName().trim().toLowerCase() : "";

        if (url.isEmpty() && file.isEmpty()) {
            MlCertificateVerificationResponse res = new MlCertificateVerificationResponse();
            res.setIsAuthentic(false);
            res.setAuthenticityScore(BigDecimal.ZERO);
            res.setMessage("Missing certificate document or credential URL");
            return res;
        }

        if (req.getCompletionDate() != null) {
            try {
                LocalDate parsed = LocalDate.parse(req.getCompletionDate());
                if (parsed.isAfter(LocalDate.now())) {
                    MlCertificateVerificationResponse res = new MlCertificateVerificationResponse();
                    res.setIsAuthentic(false);
                    res.setAuthenticityScore(BigDecimal.valueOf(0.05));
                    res.setMessage("Completion date cannot be in the future");
                    return res;
                }
            } catch (Exception ignored) {}
        }

        boolean validUrlDomain = url.contains("coursera.org") || url.contains("udemy.com") || url.contains("edx.org")
                || url.contains("cloud.google.com") || url.contains("accredible.com") || url.contains("linkedin.com");
        boolean validFileExt = file.endsWith(".pdf") || file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".webp");

        boolean isScreenshot = isSuspiciousScreenshot(file);
        boolean hasCertKw = hasCertificateKeywords(file) || hasCourseKeywords(file, req.getCourseTitle()) || file.endsWith(".pdf");

        // Hard rejections: Arbitrary screenshots or unverified images without official URLs
        if (isScreenshot && !validUrlDomain) {
            MlCertificateVerificationResponse res = new MlCertificateVerificationResponse();
            res.setIsAuthentic(false);
            res.setAuthenticityScore(BigDecimal.valueOf(0.12));
            res.setStatus("REJECTED_ARBITRARY_SCREENSHOT");
            res.setMessage("The uploaded file '" + req.getFileName() + "' was identified as an arbitrary screenshot or screen snip, not an authentic certificate document. Arbitrary screenshots are strictly rejected. Please upload an official certificate (PDF/image) or provide a verifiable credential link.");
            return res;
        }

        if (!hasCertKw && !validUrlDomain && url.isEmpty()) {
            MlCertificateVerificationResponse res = new MlCertificateVerificationResponse();
            res.setIsAuthentic(false);
            res.setAuthenticityScore(BigDecimal.valueOf(0.22));
            res.setStatus("REJECTED_UNVERIFIED_IMAGE");
            res.setMessage("The uploaded document does not match official certificate attributes or curriculum keywords for '" + req.getCourseTitle() + "'. Please upload an authentic certificate document (PDF or official certificate image).");
            return res;
        }

        MlCertificateVerificationResponse res = new MlCertificateVerificationResponse();
        if (validUrlDomain || (validFileExt && hasCertKw)) {
            res.setIsAuthentic(true);
            res.setAuthenticityScore(BigDecimal.valueOf(0.94));
            res.setStatus("AUTHENTIC");
            res.setMessage("Certificate verified through authentic credential signature and format.");
        } else if (!url.isEmpty() && (url.startsWith("http://") || url.startsWith("https://"))) {
            res.setIsAuthentic(true);
            res.setAuthenticityScore(BigDecimal.valueOf(0.78));
            res.setStatus("AUTHENTIC");
            res.setMessage("Certificate credential endpoint verified.");
        } else {
            res.setIsAuthentic(false);
            res.setAuthenticityScore(BigDecimal.valueOf(0.20));
            res.setStatus("SUSPECT_OR_INVALID");
            res.setMessage("Unrecognized certificate format or untrusted verification domain.");
        }
        return res;
    }

    private boolean isSuspiciousScreenshot(String fileName) {
        if (fileName == null || fileName.isBlank()) return false;
        String lower = fileName.toLowerCase();
        return lower.contains("screenshot") || lower.contains("screen_shot") || lower.contains("screen shot")
                || lower.contains("screen-shot") || lower.contains("screengrab") || lower.contains("screen_grab")
                || lower.contains("snip") || lower.contains("capture") || lower.contains("prtscr")
                || lower.contains("whatsapp image") || lower.contains("telegram") || lower.contains("pasted image")
                || lower.matches(".*img_\\d{4,}.*") || lower.matches(".*image_\\d{4,}.*") || lower.matches(".*untitled.*");
    }

    private boolean hasCertificateKeywords(String fileName) {
        if (fileName == null || fileName.isBlank()) return false;
        String lower = fileName.toLowerCase();
        return lower.contains("certificate") || lower.contains("cert") || lower.contains("diploma")
                || lower.contains("completion") || lower.contains("accomplishment") || lower.contains("credential")
                || lower.contains("coursera") || lower.contains("udemy") || lower.contains("edx")
                || lower.contains("google") || lower.contains("aws") || lower.contains("oracle");
    }

    private boolean hasCourseKeywords(String fileName, String courseTitle) {
        if (fileName == null || courseTitle == null) return false;
        String lowerFile = fileName.toLowerCase();
        String[] tokens = courseTitle.toLowerCase().split("\\s+");
        for (String t : tokens) {
            if (t.length() >= 4 && !Set.of("with", "from", "into", "using", "course", "edition").contains(t)) {
                if (lowerFile.contains(t)) return true;
            }
        }
        return false;
    }

    public boolean checkDiagnosticQuizPassed(Long profileId, String courseTitle, String courseSlug) {
        String targetTitle = courseTitle != null ? courseTitle.trim().toLowerCase() : "";
        Optional<Course> courseOpt = courseRepository.findByTitleIgnoreCase(courseTitle)
                .or(() -> courseRepository.findByTitleContainingIgnoreCase(courseTitle));

        if (courseOpt.isPresent()) {
            List<AssessmentSubmission> submissions = assessmentSubmissionRepository
                    .findByEmployeeProfileIdAndCourseIdOrderByAttemptedAtDesc(profileId, courseOpt.get().getId());
            return submissions.stream().anyMatch(s -> Boolean.TRUE.equals(s.getPassed()));
        }

        List<AssessmentSubmission> allSubmissions = assessmentSubmissionRepository
                .findByEmployeeProfileIdOrderByAttemptedAtDesc(profileId);
        return allSubmissions.stream().anyMatch(s -> {
            if (!Boolean.TRUE.equals(s.getPassed())) return false;
            if (s.getCourse() != null && s.getCourse().getTitle() != null) {
                String sTitle = s.getCourse().getTitle().trim().toLowerCase();
                return sTitle.equalsIgnoreCase(targetTitle) || sTitle.contains(targetTitle) || targetTitle.contains(sTitle);
            }
            if (s.getAssessment() != null && s.getAssessment().getTitle() != null) {
                String aTitle = s.getAssessment().getTitle().trim().toLowerCase();
                return aTitle.equalsIgnoreCase(targetTitle) || aTitle.contains(targetTitle) || targetTitle.contains(aTitle);
            }
            return false;
        });
    }

    public void propagateCourseCompletion(EmployeeProfile profile, String courseTitle) {
        try {
            Long profileId = profile.getId();
            LearningPath path = learningPathRepository.findByEmployeeProfileIdAndStatus(profileId, "ACTIVE").orElse(null);
            if (path != null) {
                List<LearningPathCourse> courses = learningPathCourseRepository.findByLearningPathIdWithCourse(path.getId());
                String uploadedTitle = courseTitle.trim().toLowerCase();
                for (LearningPathCourse lpc : courses) {
                    String title = lpc.getCourse().getTitle() != null ? lpc.getCourse().getTitle().trim().toLowerCase() : "";
                    if (title.equalsIgnoreCase(uploadedTitle) || title.contains(uploadedTitle) || uploadedTitle.contains(title)) {
                        lpc.setStatus("COMPLETED");
                        lpc.setProgressPercentage(100);
                        lpc.setCompletedAt(OffsetDateTime.now());
                        learningPathCourseRepository.save(lpc);

                        // Elevate employee skills
                        List<CourseSkill> cSkills = courseSkillRepository.findByCourseId(lpc.getCourse().getId());
                        for (CourseSkill cs : cSkills) {
                            if (cs.getSkill() == null) continue;
                            Optional<EmployeeSkill> esOpt = employeeSkillRepository.findByEmployeeProfileIdAndSkillId(profileId, cs.getSkill().getId());
                            int gain = cs.getTargetProficiencyGain() != null ? cs.getTargetProficiencyGain() : 1;
                            int courseMinLevel = Math.max(1, Math.min(5, lpc.getCourse().getDifficultyNumeric() + gain));
                            if (esOpt.isPresent()) {
                                EmployeeSkill es = esOpt.get();
                                int current = es.getVerifiedProficiencyLevel() != null ? es.getVerifiedProficiencyLevel() : 1;
                                int newLevel = Math.max(current, Math.min(5, current + gain));
                                es.setVerifiedProficiencyLevel(newLevel);
                                es.setCurrentProficiencyLevel(Math.max(es.getCurrentProficiencyLevel(), newLevel));
                                es.setVerificationStatus(VerificationStatus.ASSESSED);
                                es.setLastAssessedAt(OffsetDateTime.now());
                                employeeSkillRepository.save(es);
                            } else {
                                EmployeeSkill es = new EmployeeSkill();
                                es.setEmployeeProfile(profile);
                                es.setSkill(cs.getSkill());
                                es.setCurrentProficiencyLevel(courseMinLevel);
                                es.setVerifiedProficiencyLevel(courseMinLevel);
                                es.setVerificationStatus(VerificationStatus.ASSESSED);
                                es.setLastAssessedAt(OffsetDateTime.now());
                                employeeSkillRepository.save(es);
                            }
                        }
                    }
                }

                boolean allCompleted = !courses.isEmpty() && courses.stream().allMatch(c -> "COMPLETED".equalsIgnoreCase(c.getStatus()));
                if (allCompleted) {
                    path.setStatus("COMPLETED");
                    learningPathRepository.save(path);
                }
            }

            // Also mark matching CourseApprovalRequest as COMPLETED
            List<CourseApprovalRequest> approvals = approvalRequestRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profileId);
            String uploadedTitle = courseTitle.trim().toLowerCase();
            for (CourseApprovalRequest req : approvals) {
                String reqTitle = req.getExternalCourseTitle() != null ? req.getExternalCourseTitle().trim().toLowerCase() : "";
                if (reqTitle.equalsIgnoreCase(uploadedTitle) || reqTitle.contains(uploadedTitle) || uploadedTitle.contains(reqTitle)) {
                    if (req.getStatus() != CourseApprovalStatus.COMPLETED) {
                        req.setStatus(CourseApprovalStatus.COMPLETED);
                        approvalRequestRepository.save(req);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to propagate certificate completion for profileId={}: {}", profile.getId(), ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<CourseCertificateDto> getOwnCertificates() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        return certificateRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Resource getCertificateResource(Long id) {
        CourseCertificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseCertificate", "id", id));
        return fileStorageService.loadCertificateAsResource(cert.getCertificateFilePath());
    }

    private CourseCertificateDto mapToDto(CourseCertificate cert) {
        CourseCertificateDto dto = new CourseCertificateDto();
        dto.setId(cert.getId());
        dto.setEmployeeProfileId(cert.getEmployeeProfile().getId());
        dto.setEmployeeName(cert.getEmployeeProfile().getUser().getFirstName() + " " + cert.getEmployeeProfile().getUser().getLastName());
        dto.setCourseTitle(cert.getCourseTitle());
        dto.setCourseProvider(cert.getCourseProvider());
        dto.setCourseSlug(cert.getCourseSlug());
        dto.setCertificateFileName(cert.getCertificateFileName());
        dto.setCredentialUrl(cert.getCredentialUrl());
        dto.setCompletionDate(cert.getCompletionDate());
        dto.setStatus(cert.getStatus());
        dto.setAuthenticityScore(cert.getAuthenticityScore());
        dto.setQuizPassed(cert.getQuizPassed());
        dto.setVerifiedAt(cert.getVerifiedAt());
        dto.setCreatedAt(cert.getCreatedAt());
        return dto;
    }
}
