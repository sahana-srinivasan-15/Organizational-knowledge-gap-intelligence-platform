package com.orgkgi.dto.assessment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class AssessmentHistoryDto {
    private Long submissionId;
    private Long assessmentId;
    private String assessmentTitle;
    private Long courseId;
    private String courseTitle;
    private Integer attemptNumber = 1;
    private Long skillId;
    private String skillName;
    private BigDecimal score;
    private Boolean passed;
    private OffsetDateTime attemptedAt;

    public AssessmentHistoryDto() {}

    public AssessmentHistoryDto(Long submissionId, Long assessmentId, String assessmentTitle, Long skillId, String skillName, BigDecimal score, Boolean passed, OffsetDateTime attemptedAt) {
        this(submissionId, assessmentId, assessmentTitle, null, null, 1, skillId, skillName, score, passed, attemptedAt);
    }

    public AssessmentHistoryDto(Long submissionId, Long assessmentId, String assessmentTitle, Long courseId, String courseTitle, Integer attemptNumber, Long skillId, String skillName, BigDecimal score, Boolean passed, OffsetDateTime attemptedAt) {
        this.submissionId = submissionId;
        this.assessmentId = assessmentId;
        this.assessmentTitle = assessmentTitle;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.attemptNumber = attemptNumber != null ? attemptNumber : 1;
        this.skillId = skillId;
        this.skillName = skillName;
        this.score = score;
        this.passed = passed;
        this.attemptedAt = attemptedAt;
    }

    public Long getSubmissionId() { return submissionId; }
    public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public String getAssessmentTitle() { return assessmentTitle; }
    public void setAssessmentTitle(String assessmentTitle) { this.assessmentTitle = assessmentTitle; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public OffsetDateTime getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(OffsetDateTime attemptedAt) { this.attemptedAt = attemptedAt; }
}
