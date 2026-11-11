package com.orgkgi.dto.ml;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class PredictOutcomeRequest {

    @NotNull(message = "Employee profile ID is required")
    private Long employeeProfileId;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private Long learningPathId;

    // Optional manual overrides if employee has logged external study hours
    @DecimalMin("0.0")
    @DecimalMax("40.0")
    private Double weeklyEngagementHoursOverride;

    public PredictOutcomeRequest() {}

    public PredictOutcomeRequest(Long employeeProfileId, Long courseId, Long learningPathId, Double weeklyEngagementHoursOverride) {
        this.employeeProfileId = employeeProfileId;
        this.courseId = courseId;
        this.learningPathId = learningPathId;
        this.weeklyEngagementHoursOverride = weeklyEngagementHoursOverride;
    }

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public Long getLearningPathId() { return learningPathId; }
    public void setLearningPathId(Long learningPathId) { this.learningPathId = learningPathId; }

    public Double getWeeklyEngagementHoursOverride() { return weeklyEngagementHoursOverride; }
    public void setWeeklyEngagementHoursOverride(Double weeklyEngagementHoursOverride) { this.weeklyEngagementHoursOverride = weeklyEngagementHoursOverride; }
}
