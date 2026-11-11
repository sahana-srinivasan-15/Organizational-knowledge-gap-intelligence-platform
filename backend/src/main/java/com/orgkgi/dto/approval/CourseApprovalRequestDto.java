package com.orgkgi.dto.approval;

import com.orgkgi.entity.CourseApprovalStatus;
import com.orgkgi.entity.CourseRequestPriority;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class CourseApprovalRequestDto {

    private Long id;
    private Long employeeProfileId;
    private Long employeeUserId;
    private String employeeFullName;
    private String employeeEmail;
    private Long departmentId;
    private String departmentName;
    private String employeeRoleTitle;

    private Long courseId;
    private String externalCourseTitle;
    private String externalCourseProvider;
    private String externalCourseUrl;
    private BigDecimal price;
    private Integer durationHours;
    private String difficultyLevel;
    private BigDecimal rating;

    private Long targetSkillId;
    private String targetSkillName;
    private Integer currentVerifiedProficiency;
    private Integer requiredProficiencyLevel;
    private Integer skillGap;

    private String reason;
    private String expectedOutcome;
    private CourseRequestPriority priority;
    private CourseApprovalStatus status;

    private Long managerId;
    private String managerFullName;
    private String managerComment;

    private Long alternativeCourseId;
    private String alternativeCourseTitle;

    private Long recommendedMentorId;
    private String recommendedMentorFullName;

    private LocalDate targetCompletionDate;
    private Long learningPathId;
    private Long learningPathCourseId;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime reviewedAt;

    public CourseApprovalRequestDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public Long getEmployeeUserId() { return employeeUserId; }
    public void setEmployeeUserId(Long employeeUserId) { this.employeeUserId = employeeUserId; }

    public String getEmployeeFullName() { return employeeFullName; }
    public void setEmployeeFullName(String employeeFullName) { this.employeeFullName = employeeFullName; }

    public String getEmployeeEmail() { return employeeEmail; }
    public void setEmployeeEmail(String employeeEmail) { this.employeeEmail = employeeEmail; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getEmployeeRoleTitle() { return employeeRoleTitle; }
    public void setEmployeeRoleTitle(String employeeRoleTitle) { this.employeeRoleTitle = employeeRoleTitle; }

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

    public Integer getCurrentVerifiedProficiency() { return currentVerifiedProficiency; }
    public void setCurrentVerifiedProficiency(Integer currentVerifiedProficiency) { this.currentVerifiedProficiency = currentVerifiedProficiency; }

    public Integer getRequiredProficiencyLevel() { return requiredProficiencyLevel; }
    public void setRequiredProficiencyLevel(Integer requiredProficiencyLevel) { this.requiredProficiencyLevel = requiredProficiencyLevel; }

    public Integer getSkillGap() { return skillGap; }
    public void setSkillGap(Integer skillGap) { this.skillGap = skillGap; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }

    public CourseRequestPriority getPriority() { return priority; }
    public void setPriority(CourseRequestPriority priority) { this.priority = priority; }

    public CourseApprovalStatus getStatus() { return status; }
    public void setStatus(CourseApprovalStatus status) { this.status = status; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerFullName() { return managerFullName; }
    public void setManagerFullName(String managerFullName) { this.managerFullName = managerFullName; }

    public String getManagerComment() { return managerComment; }
    public void setManagerComment(String managerComment) { this.managerComment = managerComment; }

    public Long getAlternativeCourseId() { return alternativeCourseId; }
    public void setAlternativeCourseId(Long alternativeCourseId) { this.alternativeCourseId = alternativeCourseId; }

    public String getAlternativeCourseTitle() { return alternativeCourseTitle; }
    public void setAlternativeCourseTitle(String alternativeCourseTitle) { this.alternativeCourseTitle = alternativeCourseTitle; }

    public Long getRecommendedMentorId() { return recommendedMentorId; }
    public void setRecommendedMentorId(Long recommendedMentorId) { this.recommendedMentorId = recommendedMentorId; }

    public String getRecommendedMentorFullName() { return recommendedMentorFullName; }
    public void setRecommendedMentorFullName(String recommendedMentorFullName) { this.recommendedMentorFullName = recommendedMentorFullName; }

    public LocalDate getTargetCompletionDate() { return targetCompletionDate; }
    public void setTargetCompletionDate(LocalDate targetCompletionDate) { this.targetCompletionDate = targetCompletionDate; }

    public Long getLearningPathId() { return learningPathId; }
    public void setLearningPathId(Long learningPathId) { this.learningPathId = learningPathId; }

    public Long getLearningPathCourseId() { return learningPathCourseId; }
    public void setLearningPathCourseId(Long learningPathCourseId) { this.learningPathCourseId = learningPathCourseId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
