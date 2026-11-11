package com.orgkgi.dto.learningpath;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class LearningProgressUpdateDto {

    @NotNull(message = "progressPercentage is required")
    @Min(value = 0, message = "progressPercentage must be between 0 and 100")
    @Max(value = 100, message = "progressPercentage must be between 0 and 100")
    private Integer progressPercentage;

    public LearningProgressUpdateDto() {}

    public LearningProgressUpdateDto(Integer progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }
}
