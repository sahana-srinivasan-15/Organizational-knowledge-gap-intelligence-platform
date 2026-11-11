package com.orgkgi.dto.assessment;

import java.util.ArrayList;
import java.util.List;

/**
 * Specification for diagnostic questions generated dynamically via OpenAI API or deterministic fallback.
 */
public class GeneratedQuestionSpec {

    private String questionText;
    private List<String> options = new ArrayList<>();
    private Integer correctOptionIndex;
    private Integer difficultyLevel = 1;
    private String topic;
    private String explanation;
    private Integer estimatedTimeSeconds = 60;

    public GeneratedQuestionSpec() {}

    public GeneratedQuestionSpec(String questionText, List<String> options, Integer correctOptionIndex,
                                 Integer difficultyLevel, String topic, String explanation, Integer estimatedTimeSeconds) {
        this.questionText = questionText;
        this.options = options != null ? options : new ArrayList<>();
        this.correctOptionIndex = correctOptionIndex;
        this.difficultyLevel = difficultyLevel != null ? difficultyLevel : 1;
        this.topic = topic;
        this.explanation = explanation;
        this.estimatedTimeSeconds = estimatedTimeSeconds != null ? estimatedTimeSeconds : 60;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public Integer getCorrectOptionIndex() {
        return correctOptionIndex;
    }

    public void setCorrectOptionIndex(Integer correctOptionIndex) {
        this.correctOptionIndex = correctOptionIndex;
    }

    public Integer getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(Integer difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Integer getEstimatedTimeSeconds() {
        return estimatedTimeSeconds;
    }

    public void setEstimatedTimeSeconds(Integer estimatedTimeSeconds) {
        this.estimatedTimeSeconds = estimatedTimeSeconds;
    }
}

