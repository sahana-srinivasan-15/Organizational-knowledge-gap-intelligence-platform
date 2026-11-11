package com.orgkgi.dto.manager;

public class TeamMemberProgressDto {

    private Long employeeProfileId;
    private Long userId;
    private String fullName;
    private String email;
    private String currentRoleTitle;
    private String targetRoleTitle;
    private Double readinessScorePercentage;
    private Integer activeCoursesCount;
    private Integer overallLearningProgressPercentage;
    private String currentLearningStatus; // ON_TRACK, FALLING_BEHIND, COMPLETED, NOT_STARTED
    private String assignedMentorName;
    private Integer verifiedSkillsCount;
    private Integer gapSkillsCount;

    public TeamMemberProgressDto() {}

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCurrentRoleTitle() { return currentRoleTitle; }
    public void setCurrentRoleTitle(String currentRoleTitle) { this.currentRoleTitle = currentRoleTitle; }

    public String getTargetRoleTitle() { return targetRoleTitle; }
    public void setTargetRoleTitle(String targetRoleTitle) { this.targetRoleTitle = targetRoleTitle; }

    public Double getReadinessScorePercentage() { return readinessScorePercentage; }
    public void setReadinessScorePercentage(Double readinessScorePercentage) { this.readinessScorePercentage = readinessScorePercentage; }

    public Integer getActiveCoursesCount() { return activeCoursesCount; }
    public void setActiveCoursesCount(Integer activeCoursesCount) { this.activeCoursesCount = activeCoursesCount; }

    public Integer getOverallLearningProgressPercentage() { return overallLearningProgressPercentage; }
    public void setOverallLearningProgressPercentage(Integer overallLearningProgressPercentage) { this.overallLearningProgressPercentage = overallLearningProgressPercentage; }

    public String getCurrentLearningStatus() { return currentLearningStatus; }
    public void setCurrentLearningStatus(String currentLearningStatus) { this.currentLearningStatus = currentLearningStatus; }

    public String getAssignedMentorName() { return assignedMentorName; }
    public void setAssignedMentorName(String assignedMentorName) { this.assignedMentorName = assignedMentorName; }

    public Integer getVerifiedSkillsCount() { return verifiedSkillsCount; }
    public void setVerifiedSkillsCount(Integer verifiedSkillsCount) { this.verifiedSkillsCount = verifiedSkillsCount; }

    public Integer getGapSkillsCount() { return gapSkillsCount; }
    public void setGapSkillsCount(Integer gapSkillsCount) { this.gapSkillsCount = gapSkillsCount; }
}
