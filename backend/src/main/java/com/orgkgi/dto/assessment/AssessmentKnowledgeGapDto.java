package com.orgkgi.dto.assessment;

public class AssessmentKnowledgeGapDto {
    private String topic;
    private int questionsTested;
    private int questionsMissed;
    private double masteryPercentage;
    private String severity; // HIGH, MEDIUM, LOW

    public AssessmentKnowledgeGapDto() {}

    public AssessmentKnowledgeGapDto(String topic, int questionsTested, int questionsMissed, double masteryPercentage, String severity) {
        this.topic = topic;
        this.questionsTested = questionsTested;
        this.questionsMissed = questionsMissed;
        this.masteryPercentage = masteryPercentage;
        this.severity = severity;
    }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public int getQuestionsTested() { return questionsTested; }
    public void setQuestionsTested(int questionsTested) { this.questionsTested = questionsTested; }

    public int getQuestionsMissed() { return questionsMissed; }
    public void setQuestionsMissed(int questionsMissed) { this.questionsMissed = questionsMissed; }

    public double getMasteryPercentage() { return masteryPercentage; }
    public void setMasteryPercentage(double masteryPercentage) { this.masteryPercentage = masteryPercentage; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
}
