package com.orgkgi.dto.assessment;

import java.util.List;

public class QuestionFeedbackDto {
    private Long questionId;
    private Integer selectedOptionIndex;
    private Boolean isCorrect;
    private Integer difficultyLevel;
    private String questionText;
    private List<String> options;
    private Integer correctOptionIndex;
    private String explanation;
    private String topic;

    public QuestionFeedbackDto() {}

    public QuestionFeedbackDto(Long questionId, Integer selectedOptionIndex, Boolean isCorrect, Integer difficultyLevel) {
        this.questionId = questionId;
        this.selectedOptionIndex = selectedOptionIndex;
        this.isCorrect = isCorrect;
        this.difficultyLevel = difficultyLevel;
    }

    public QuestionFeedbackDto(Long questionId, Integer selectedOptionIndex, Boolean isCorrect, Integer difficultyLevel,
                               String questionText, List<String> options, Integer correctOptionIndex, String explanation, String topic) {
        this.questionId = questionId;
        this.selectedOptionIndex = selectedOptionIndex;
        this.isCorrect = isCorrect;
        this.difficultyLevel = difficultyLevel;
        this.questionText = questionText;
        this.options = options;
        this.correctOptionIndex = correctOptionIndex;
        this.explanation = explanation;
        this.topic = topic;
    }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public Integer getSelectedOptionIndex() { return selectedOptionIndex; }
    public void setSelectedOptionIndex(Integer selectedOptionIndex) { this.selectedOptionIndex = selectedOptionIndex; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public Integer getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(Integer difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Integer getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(Integer correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
}
