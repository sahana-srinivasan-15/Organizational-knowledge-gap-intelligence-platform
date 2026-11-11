package com.orgkgi.dto.assessment;

import java.util.List;

/**
 * Question representation delivered to clients for assessment taking.
 * SECURITY: Absolutely does NOT include correct_option_index or answer keys.
 */
public class QuestionDto {
    private Long id;
    private String questionText;
    private List<String> options;
    private Integer difficultyLevel;
    private String topic;
    private Integer estimatedTimeSeconds = 60;

    public QuestionDto() {}

    public QuestionDto(Long id, String questionText, List<String> options, Integer difficultyLevel) {
        this(id, questionText, options, difficultyLevel, null, 60);
    }

    public QuestionDto(Long id, String questionText, List<String> options, Integer difficultyLevel, String topic, Integer estimatedTimeSeconds) {
        this.id = id;
        this.questionText = questionText;
        this.options = options;
        this.difficultyLevel = difficultyLevel;
        this.topic = topic;
        this.estimatedTimeSeconds = estimatedTimeSeconds != null ? estimatedTimeSeconds : 60;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Integer getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(Integer difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public Integer getEstimatedTimeSeconds() { return estimatedTimeSeconds; }
    public void setEstimatedTimeSeconds(Integer estimatedTimeSeconds) { this.estimatedTimeSeconds = estimatedTimeSeconds; }
}
