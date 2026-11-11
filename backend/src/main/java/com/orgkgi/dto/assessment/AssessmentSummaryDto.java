package com.orgkgi.dto.assessment;

import java.math.BigDecimal;

public class AssessmentSummaryDto {
    private Long id;
    private String title;
    private Long skillId;
    private String skillName;
    private BigDecimal passingScore;
    private Integer timeLimitMinutes;
    private String description;
    private int questionCount;

    public AssessmentSummaryDto() {}

    public AssessmentSummaryDto(Long id, String title, Long skillId, String skillName, BigDecimal passingScore, Integer timeLimitMinutes, String description, int questionCount) {
        this.id = id;
        this.title = title;
        this.skillId = skillId;
        this.skillName = skillName;
        this.passingScore = passingScore;
        this.timeLimitMinutes = timeLimitMinutes;
        this.description = description;
        this.questionCount = questionCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
}
