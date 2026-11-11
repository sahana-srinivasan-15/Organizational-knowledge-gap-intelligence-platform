package com.orgkgi.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "course_certificates")
public class CourseCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_profile_id", nullable = false)
    private EmployeeProfile employeeProfile;

    @Column(name = "course_title", nullable = false)
    private String courseTitle;

    @Column(name = "course_provider")
    private String courseProvider;

    @Column(name = "course_slug")
    private String courseSlug;

    @Column(name = "certificate_file_name")
    private String certificateFileName;

    @Column(name = "certificate_file_path")
    private String certificateFilePath;

    @Column(name = "credential_url")
    private String credentialUrl;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "status", nullable = false)
    private String status = "VERIFIED";

    @Column(name = "authenticity_score", precision = 5, scale = 2)
    private java.math.BigDecimal authenticityScore = java.math.BigDecimal.ZERO;

    @Column(name = "quiz_passed")
    private Boolean quizPassed = false;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public CourseCertificate() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EmployeeProfile getEmployeeProfile() {
        return employeeProfile;
    }

    public void setEmployeeProfile(EmployeeProfile employeeProfile) {
        this.employeeProfile = employeeProfile;
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

    public String getCertificateFilePath() {
        return certificateFilePath;
    }

    public void setCertificateFilePath(String certificateFilePath) {
        this.certificateFilePath = certificateFilePath;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

