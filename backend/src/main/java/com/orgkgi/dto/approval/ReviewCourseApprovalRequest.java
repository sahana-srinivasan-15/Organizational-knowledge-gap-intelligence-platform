package com.orgkgi.dto.approval;

import com.orgkgi.entity.CourseApprovalStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class ReviewCourseApprovalRequest {

    @NotNull(message = "Decision status is required")
    private CourseApprovalStatus status; // APPROVED, REJECTED, CHANGES_REQUESTED

    private String managerComment;

    private Long alternativeCourseId; // If manager suggests a better alternative

    private Long recommendedMentorProfileId; // If manager assigns a mentor

    private LocalDate targetCompletionDate; // Learning deadline

    public ReviewCourseApprovalRequest() {}

    public CourseApprovalStatus getStatus() { return status; }
    public void setStatus(CourseApprovalStatus status) { this.status = status; }

    public String getManagerComment() { return managerComment; }
    public void setManagerComment(String managerComment) { this.managerComment = managerComment; }

    public Long getAlternativeCourseId() { return alternativeCourseId; }
    public void setAlternativeCourseId(Long alternativeCourseId) { this.alternativeCourseId = alternativeCourseId; }

    public Long getRecommendedMentorProfileId() { return recommendedMentorProfileId; }
    public void setRecommendedMentorProfileId(Long recommendedMentorProfileId) { this.recommendedMentorProfileId = recommendedMentorProfileId; }

    public LocalDate getTargetCompletionDate() { return targetCompletionDate; }
    public void setTargetCompletionDate(LocalDate targetCompletionDate) { this.targetCompletionDate = targetCompletionDate; }
}
