package com.orgkgi.dto.assessment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class CourseAssessmentEligibilityDto {
    private Long courseId;
    private String courseTitle;
    private String provider;
    private String difficultyLevel;
    private BigDecimal rating;
    private Integer durationHours;
    private Long primarySkillId;
    private String primarySkillName;
    private Long assessmentId;
    private Integer questionPoolSize;
    private Integer totalAttempts;
    private BigDecimal bestScore;
    private OffsetDateTime latestAttemptDate;
    private Boolean latestPassed;
    private Integer timeLimitMinutes;
    private BigDecimal passingScore;

    public CourseAssessmentEligibilityDto() {}

    public CourseAssessmentEligibilityDto(Long courseId, String courseTitle, String provider, String difficultyLevel,
                                          BigDecimal rating, Integer durationHours, Long primarySkillId, String primarySkillName,
                                          Long assessmentId, Integer questionPoolSize, Integer totalAttempts,
                                          BigDecimal bestScore, OffsetDateTime latestAttemptDate, Boolean latestPassed,
                                          Integer timeLimitMinutes, BigDecimal passingScore) {
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.provider = provider;
        this.difficultyLevel = difficultyLevel;
        this.rating = rating;
        this.durationHours = durationHours;
        this.primarySkillId = primarySkillId;
        this.primarySkillName = primarySkillName;
        this.assessmentId = assessmentId;
        this.questionPoolSize = questionPoolSize;
        this.totalAttempts = totalAttempts;
        this.bestScore = bestScore;
        this.latestAttemptDate = latestAttemptDate;
        this.latestPassed = latestPassed;
        this.timeLimitMinutes = timeLimitMinutes;
        this.passingScore = passingScore;
    }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }

    public Long getPrimarySkillId() { return primarySkillId; }
    public void setPrimarySkillId(Long primarySkillId) { this.primarySkillId = primarySkillId; }

    public String getPrimarySkillName() { return primarySkillName; }
    public void setPrimarySkillName(String primarySkillName) { this.primarySkillName = primarySkillName; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public Integer getQuestionPoolSize() { return questionPoolSize; }
    public void setQuestionPoolSize(Integer questionPoolSize) { this.questionPoolSize = questionPoolSize; }

    public Integer getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(Integer totalAttempts) { this.totalAttempts = totalAttempts; }

    public BigDecimal getBestScore() { return bestScore; }
    public void setBestScore(BigDecimal bestScore) { this.bestScore = bestScore; }

    public OffsetDateTime getLatestAttemptDate() { return latestAttemptDate; }
    public void setLatestAttemptDate(OffsetDateTime latestAttemptDate) { this.latestAttemptDate = latestAttemptDate; }

    public Boolean getLatestPassed() { return latestPassed; }
    public void setLatestPassed(Boolean latestPassed) { this.latestPassed = latestPassed; }

    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public BigDecimal getPassingScore() { return passingScore; }
    public void setPassingScore(BigDecimal passingScore) { this.passingScore = passingScore; }
}
