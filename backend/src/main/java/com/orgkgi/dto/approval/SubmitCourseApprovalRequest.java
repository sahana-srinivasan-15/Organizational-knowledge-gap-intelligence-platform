package com.orgkgi.dto.approval;

import com.orgkgi.entity.CourseRequestPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class SubmitCourseApprovalRequest {

    private Long courseId; // Optional: if selecting from catalog

    @NotBlank(message = "Course title is required")
    private String externalCourseTitle;

    @NotBlank(message = "Course provider is required")
    private String externalCourseProvider;

    private String externalCourseUrl;

    private BigDecimal price = BigDecimal.ZERO;

    private Integer durationHours = 10;

    private String difficultyLevel = "BEGINNER";

    private BigDecimal rating = new BigDecimal("4.50");

    private Long targetSkillId;

    private String targetSkillName;

    @NotBlank(message = "Reason for taking course is required")
    private String reason;

    private String expectedOutcome;

    @NotNull(message = "Priority is required")
    private CourseRequestPriority priority = CourseRequestPriority.MEDIUM;

    private LocalDate targetCompletionDate;

    public SubmitCourseApprovalRequest() {}

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getExternalCourseTitle() { return externalCourseTitle; }
    public void setExternalCourseTitle(String externalCourseTitle) { this.externalCourseTitle = externalCourseTitle; }

    public String getExternalCourseProvider() { return externalCourseProvider; }
    public void setExternalCourseProvider(String externalCourseProvider) { this.externalCourseProvider = externalCourseProvider; }

    public String getExternalCourseUrl() { return externalCourseUrl; }
    public void setExternalCourseUrl(String externalCourseUrl) { this.externalCourseUrl = externalCourseUrl; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Long getTargetSkillId() { return targetSkillId; }
    public void setTargetSkillId(Long targetSkillId) { this.targetSkillId = targetSkillId; }

    public String getTargetSkillName() { return targetSkillName; }
    public void setTargetSkillName(String targetSkillName) { this.targetSkillName = targetSkillName; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }

    public CourseRequestPriority getPriority() { return priority; }
    public void setPriority(CourseRequestPriority priority) { this.priority = priority; }

    public LocalDate getTargetCompletionDate() { return targetCompletionDate; }
    public void setTargetCompletionDate(LocalDate targetCompletionDate) { this.targetCompletionDate = targetCompletionDate; }
}
