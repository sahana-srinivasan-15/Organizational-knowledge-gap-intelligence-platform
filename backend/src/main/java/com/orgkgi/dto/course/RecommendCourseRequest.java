package com.orgkgi.dto.course;

import jakarta.validation.constraints.NotNull;

public class RecommendCourseRequest {

    @NotNull(message = "Employee Profile ID is required")
    private Long employeeProfileId;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private String notes;

    public RecommendCourseRequest() {}

    public RecommendCourseRequest(Long employeeProfileId, Long courseId, String notes) {
        this.employeeProfileId = employeeProfileId;
        this.courseId = courseId;
        this.notes = notes;
    }

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

