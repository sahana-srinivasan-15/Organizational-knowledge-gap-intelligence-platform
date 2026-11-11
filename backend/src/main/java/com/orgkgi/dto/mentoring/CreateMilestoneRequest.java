package com.orgkgi.dto.mentoring;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class CreateMilestoneRequest {

    private Long mentorAssignmentId;
    private Long learningPathCourseId;

    @NotBlank(message = "Milestone title is required")
    private String title;

    private String description;
    private LocalDate targetDate;

    public CreateMilestoneRequest() {}

    public Long getMentorAssignmentId() { return mentorAssignmentId; }
    public void setMentorAssignmentId(Long mentorAssignmentId) { this.mentorAssignmentId = mentorAssignmentId; }

    public Long getLearningPathCourseId() { return learningPathCourseId; }
    public void setLearningPathCourseId(Long learningPathCourseId) { this.learningPathCourseId = learningPathCourseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
}
