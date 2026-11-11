package com.orgkgi.dto.certificate;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class CourseCertificateDto {

    private Long id;
    private Long employeeProfileId;
    private String employeeName;
    private String courseTitle;
    private String courseProvider;
    private String courseSlug;
    private String certificateFileName;
    private String credentialUrl;
    private LocalDate completionDate;
    private String status;
    private java.math.BigDecimal authenticityScore;
    private Boolean quizPassed;
    private OffsetDateTime verifiedAt;
    private String verificationMessage;
    private OffsetDateTime createdAt;

    public CourseCertificateDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeProfileId() {
        return employeeProfileId;
    }

    public void setEmployeeProfileId(Long employeeProfileId) {
        this.employeeProfileId = employeeProfileId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getCourseProvider() {
        return courseProvider;
    }

    public void setCourseProvider(String courseProvider) {
        this.courseProvider = courseProvider;
    }

    public String getCourseSlug() {
        return courseSlug;
    }

    public void setCourseSlug(String courseSlug) {
        this.courseSlug = courseSlug;
    }

    public String getCertificateFileName() {
        return certificateFileName;
    }

    public void setCertificateFileName(String certificateFileName) {
        this.certificateFileName = certificateFileName;
    }

    public String getCredentialUrl() {
        return credentialUrl;
    }

    public void setCredentialUrl(String credentialUrl) {
        this.credentialUrl = credentialUrl;
    }

    public LocalDate getCompletionDate() {
        return completionDate;
    }

    public void setCompletionDate(LocalDate completionDate) {
        this.completionDate = completionDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public java.math.BigDecimal getAuthenticityScore() {
        return authenticityScore;
    }

    public void setAuthenticityScore(java.math.BigDecimal authenticityScore) {
        this.authenticityScore = authenticityScore;
    }

    public Boolean getQuizPassed() {
        return quizPassed;
    }

    public void setQuizPassed(Boolean quizPassed) {
        this.quizPassed = quizPassed;
    }

    public OffsetDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(OffsetDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getVerificationMessage() {
        return verificationMessage;
    }

    public void setVerificationMessage(String verificationMessage) {
        this.verificationMessage = verificationMessage;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

