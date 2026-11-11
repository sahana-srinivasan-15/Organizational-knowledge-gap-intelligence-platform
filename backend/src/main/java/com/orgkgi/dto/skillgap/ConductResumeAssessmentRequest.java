package com.orgkgi.dto.skillgap;

public class ConductResumeAssessmentRequest {

    private String resumeFileName;
    private Double targetScore;
    private Integer totalQuestions;
    private Integer correctCount;
    private String answersJson;

    public ConductResumeAssessmentRequest() {}

    public ConductResumeAssessmentRequest(String resumeFileName, Double targetScore) {
        this.resumeFileName = resumeFileName;
        this.targetScore = targetScore;
    }

    public ConductResumeAssessmentRequest(String resumeFileName, Double targetScore, Integer totalQuestions, Integer correctCount, String answersJson) {
        this.resumeFileName = resumeFileName;
        this.targetScore = targetScore;
        this.totalQuestions = totalQuestions;
        this.correctCount = correctCount;
        this.answersJson = answersJson;
    }

    public String getResumeFileName() {
        return resumeFileName;
    }

    public void setResumeFileName(String resumeFileName) {
        this.resumeFileName = resumeFileName;
    }

    public Double getTargetScore() {
        return targetScore;
    }

    public void setTargetScore(Double targetScore) {
        this.targetScore = targetScore;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer correctCount) {
        this.correctCount = correctCount;
    }

    public String getAnswersJson() {
        return answersJson;
    }

    public void setAnswersJson(String answersJson) {
        this.answersJson = answersJson;
    }
}

