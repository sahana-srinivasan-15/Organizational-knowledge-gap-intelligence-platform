package com.orgkgi.dto.assessment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AnswerSubmissionDto {

    @NotNull(message = "questionId is required")
    private Long questionId;

    @NotNull(message = "selectedOptionIndex is required")
    @Min(value = 0, message = "selectedOptionIndex must be non-negative")
    private Integer selectedOptionIndex;

    public AnswerSubmissionDto() {}

    public AnswerSubmissionDto(Long questionId, Integer selectedOptionIndex) {
        this.questionId = questionId;
        this.selectedOptionIndex = selectedOptionIndex;
    }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public Integer getSelectedOptionIndex() { return selectedOptionIndex; }
    public void setSelectedOptionIndex(Integer selectedOptionIndex) { this.selectedOptionIndex = selectedOptionIndex; }
}
