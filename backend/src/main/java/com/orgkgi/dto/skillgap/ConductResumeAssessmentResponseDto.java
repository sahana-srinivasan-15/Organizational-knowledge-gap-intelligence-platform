package com.orgkgi.dto.skillgap;

import java.time.OffsetDateTime;

public class ConductResumeAssessmentResponseDto {

    private Double testScore;
    private Integer totalQuestions;
    private Integer correctCount;
    private Boolean passed;
    private OffsetDateTime completedAt;
    private SkillGapReportDto report;
    private SendGapReportResponseDto managerDelivery;
    private String message;

    public ConductResumeAssessmentResponseDto() {}

    public Double getTestScore() { return testScore; }
    public void setTestScore(Double testScore) { this.testScore = testScore; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public SkillGapReportDto getReport() { return report; }
    public void setReport(SkillGapReportDto report) { this.report = report; }

    public SendGapReportResponseDto getManagerDelivery() { return managerDelivery; }
    public void setManagerDelivery(SendGapReportResponseDto managerDelivery) { this.managerDelivery = managerDelivery; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

