package com.orgkgi.dto.assessment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class AssessmentAttemptStartDto {
    private Long assessmentId;
    private String title;
    private Long skillId;
    private String skillName;
    private BigDecimal passingScore;
    private Integer timeLimitMinutes;
    private OffsetDateTime startedAt;
    private OffsetDateTime expiresAt;
    private List<QuestionDto> questions;

    private Long attemptId;
    private Integer attemptNumber = 1;
    private Long courseId;
    private String courseTitle;
    private Integer totalQuestions;

    public AssessmentAttemptStartDto() {}

    public AssessmentAttemptStartDto(Long assessmentId, String title, Long skillId, String skillName, BigDecimal passingScore, Integer timeLimitMinutes, OffsetDateTime startedAt, OffsetDateTime expiresAt, List<QuestionDto> questions) {
        this(null, 1, null, null, assessmentId, title, skillId, skillName, passingScore, timeLimitMinutes, startedAt, expiresAt, questions != null ? questions.size() : 0, questions);
    }

    public AssessmentAttemptStartDto(Long attemptId, Integer attemptNumber, Long courseId, String courseTitle,
                                    Long assessmentId, String title, Long skillId, String skillName,
                                    BigDecimal passingScore, Integer timeLimitMinutes,
                                    OffsetDateTime startedAt, OffsetDateTime expiresAt,
                                    Integer totalQuestions, List<QuestionDto> questions) {
        this.attemptId = attemptId;
        this.attemptNumber = attemptNumber != null ? attemptNumber : 1;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.assessmentId = assessmentId;
        this.title = title;
        this.skillId = skillId;
        this.skillName = skillName;
        this.passingScore = passingScore;
        this.timeLimitMinutes = timeLimitMinutes;
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
        this.totalQuestions = totalQuestions != null ? totalQuestions : (questions != null ? questions.size() : 0);
        this.questions = questions;
    }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public BigDecimal getPassingScore() { return passingScore; }
    public void setPassingScore(BigDecimal passingScore) { this.passingScore = passingScore; }

    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public List<QuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDto> questions) { this.questions = questions; }

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
}
