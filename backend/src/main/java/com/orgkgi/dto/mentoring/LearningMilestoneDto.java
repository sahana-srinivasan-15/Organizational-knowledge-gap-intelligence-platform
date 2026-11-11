package com.orgkgi.dto.mentoring;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class LearningMilestoneDto {

    private Long id;
    private Long mentorAssignmentId;
    private Long learningPathCourseId;
    private String title;
    private String description;
    private LocalDate targetDate;
    private LocalDate completedDate;
    private String status; // PENDING, IN_PROGRESS, COMPLETED, OVERDUE
    private Long createdByUserId;
    private String createdByFullName;
    private OffsetDateTime createdAt;

    public LearningMilestoneDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }

    public String getCreatedByFullName() { return createdByFullName; }
    public void setCreatedByFullName(String createdByFullName) { this.createdByFullName = createdByFullName; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
