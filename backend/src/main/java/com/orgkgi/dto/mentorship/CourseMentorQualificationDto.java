package com.orgkgi.dto.mentorship;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class CourseMentorQualificationDto {

    private Long courseId;
    private String courseTitle;
    private String courseProvider;
    private String courseSlug;
    private String difficultyLevel;
    private Long primarySkillId;
    private String primarySkillName;

    // Certificate details
    private Boolean certificateUploaded;
    private Long certificateId;
    private String certificateStatus; // CERTIFIED, ML_VERIFIED_PENDING_QUIZ, VERIFIED, NOT_UPLOADED
    private String certificateFileName;
    private String credentialUrl;
    private LocalDate certificateCompletionDate;
    private BigDecimal authenticityScore;
    private OffsetDateTime certificateVerifiedAt;

    // Diagnostic quiz details
    private Boolean quizAttended;
    private Boolean quizPassed;
    private BigDecimal quizScore;
    private OffsetDateTime quizAttemptedAt;
    private Long assessmentId;

    // Strict qualification state: TRUE ONLY IF certificateUploaded && quizPassed
    private Boolean isMentorQualified;
    private String qualificationStatus; // QUALIFIED_MENTOR, PENDING_QUIZ, PENDING_CERTIFICATE, QUIZ_RETAKE_REQUIRED, NOT_STARTED
    private String badgeText;
    private String guidanceMessage;

    public CourseMentorQualificationDto() {}

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getCourseProvider() { return courseProvider; }
    public void setCourseProvider(String courseProvider) { this.courseProvider = courseProvider; }

    public String getCourseSlug() { return courseSlug; }
    public void setCourseSlug(String courseSlug) { this.courseSlug = courseSlug; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public Long getPrimarySkillId() { return primarySkillId; }
    public void setPrimarySkillId(Long primarySkillId) { this.primarySkillId = primarySkillId; }

    public String getPrimarySkillName() { return primarySkillName; }
    public void setPrimarySkillName(String primarySkillName) { this.primarySkillName = primarySkillName; }

    public Boolean getCertificateUploaded() { return certificateUploaded; }
    public void setCertificateUploaded(Boolean certificateUploaded) { this.certificateUploaded = certificateUploaded; }

    public Long getCertificateId() { return certificateId; }
    public void setCertificateId(Long certificateId) { this.certificateId = certificateId; }

    public String getCertificateStatus() { return certificateStatus; }
    public void setCertificateStatus(String certificateStatus) { this.certificateStatus = certificateStatus; }

    public String getCertificateFileName() { return certificateFileName; }
    public void setCertificateFileName(String certificateFileName) { this.certificateFileName = certificateFileName; }

    public String getCredentialUrl() { return credentialUrl; }
    public void setCredentialUrl(String credentialUrl) { this.credentialUrl = credentialUrl; }

    public LocalDate getCertificateCompletionDate() { return certificateCompletionDate; }
    public void setCertificateCompletionDate(LocalDate certificateCompletionDate) { this.certificateCompletionDate = certificateCompletionDate; }

    public BigDecimal getAuthenticityScore() { return authenticityScore; }
    public void setAuthenticityScore(BigDecimal authenticityScore) { this.authenticityScore = authenticityScore; }

    public OffsetDateTime getCertificateVerifiedAt() { return certificateVerifiedAt; }
    public void setCertificateVerifiedAt(OffsetDateTime certificateVerifiedAt) { this.certificateVerifiedAt = certificateVerifiedAt; }

    public Boolean getQuizAttended() { return quizAttended; }
    public void setQuizAttended(Boolean quizAttended) { this.quizAttended = quizAttended; }

    public Boolean getQuizPassed() { return quizPassed; }
    public void setQuizPassed(Boolean quizPassed) { this.quizPassed = quizPassed; }

    public BigDecimal getQuizScore() { return quizScore; }
    public void setQuizScore(BigDecimal quizScore) { this.quizScore = quizScore; }

    public OffsetDateTime getQuizAttemptedAt() { return quizAttemptedAt; }
    public void setQuizAttemptedAt(OffsetDateTime quizAttemptedAt) { this.quizAttemptedAt = quizAttemptedAt; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public Boolean getIsMentorQualified() { return isMentorQualified; }
    public void setIsMentorQualified(Boolean isMentorQualified) { this.isMentorQualified = isMentorQualified; }

    public String getQualificationStatus() { return qualificationStatus; }
    public void setQualificationStatus(String qualificationStatus) { this.qualificationStatus = qualificationStatus; }

    public String getBadgeText() { return badgeText; }
    public void setBadgeText(String badgeText) { this.badgeText = badgeText; }

    public String getGuidanceMessage() { return guidanceMessage; }
    public void setGuidanceMessage(String guidanceMessage) { this.guidanceMessage = guidanceMessage; }
}

