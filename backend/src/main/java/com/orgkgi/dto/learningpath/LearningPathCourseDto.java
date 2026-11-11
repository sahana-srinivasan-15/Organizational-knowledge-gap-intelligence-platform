package com.orgkgi.dto.learningpath;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class LearningPathCourseDto {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private String provider;
    private Integer durationHours;
    private String difficultyLevel;
    private BigDecimal rating;
    private Integer stepOrder;
    private String status;
    private Integer progressPercentage;
    private OffsetDateTime completedAt;
    private Boolean hasUploadedCertificate;
    private String certificateStatus;
    private Boolean quizPassed;
    private String courseUrl;

    public LearningPathCourseDto() {}

    public LearningPathCourseDto(Long id, Long courseId, String courseTitle, String provider, Integer durationHours, String difficultyLevel, BigDecimal rating, Integer stepOrder, String status, Integer progressPercentage, OffsetDateTime completedAt) {
        this.id = id;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.provider = provider;
        this.durationHours = durationHours;
        this.difficultyLevel = difficultyLevel;
        this.rating = rating;
        this.stepOrder = stepOrder;
        this.status = status;
        this.progressPercentage = progressPercentage;
        this.completedAt = completedAt;
        this.hasUploadedCertificate = false;
        this.certificateStatus = null;
        this.quizPassed = false;
    }

    public LearningPathCourseDto(Long id, Long courseId, String courseTitle, String provider, Integer durationHours, String difficultyLevel, BigDecimal rating, Integer stepOrder, String status, Integer progressPercentage, OffsetDateTime completedAt, Boolean hasUploadedCertificate) {
        this.id = id;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.provider = provider;
        this.durationHours = durationHours;
        this.difficultyLevel = difficultyLevel;
        this.rating = rating;
        this.stepOrder = stepOrder;
        this.status = status;
        this.progressPercentage = progressPercentage;
        this.completedAt = completedAt;
        this.hasUploadedCertificate = hasUploadedCertificate;
        this.certificateStatus = null;
        this.quizPassed = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Integer getStepOrder() { return stepOrder; }
    public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public Boolean getHasUploadedCertificate() { return hasUploadedCertificate; }
    public void setHasUploadedCertificate(Boolean hasUploadedCertificate) { this.hasUploadedCertificate = hasUploadedCertificate; }

    public String getCertificateStatus() { return certificateStatus; }
    public void setCertificateStatus(String certificateStatus) { this.certificateStatus = certificateStatus; }

    public Boolean getQuizPassed() { return quizPassed; }
    public void setQuizPassed(Boolean quizPassed) { this.quizPassed = quizPassed; }

    public String getCourseUrl() { return courseUrl; }
    public void setCourseUrl(String courseUrl) { this.courseUrl = courseUrl; }
}
