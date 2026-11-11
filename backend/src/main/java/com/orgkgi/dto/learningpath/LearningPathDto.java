package com.orgkgi.dto.learningpath;

import java.time.OffsetDateTime;
import java.util.List;

public class LearningPathDto {
    private Long id;
    private Long employeeProfileId;
    private String employeeName;
    private Long targetJobRoleId;
    private String targetJobRoleTitle;
    private String title;
    private String status;
    private int totalCourses;
    private int completedCourses;
    private int overallProgressPercentage;
    private List<LearningPathCourseDto> courses;
    private List<String> uncoveredSkillGaps;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public LearningPathDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public Long getTargetJobRoleId() { return targetJobRoleId; }
    public void setTargetJobRoleId(Long targetJobRoleId) { this.targetJobRoleId = targetJobRoleId; }

    public String getTargetJobRoleTitle() { return targetJobRoleTitle; }
    public void setTargetJobRoleTitle(String targetJobRoleTitle) { this.targetJobRoleTitle = targetJobRoleTitle; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getTotalCourses() { return totalCourses; }
    public void setTotalCourses(int totalCourses) { this.totalCourses = totalCourses; }

    public int getCompletedCourses() { return completedCourses; }
    public void setCompletedCourses(int completedCourses) { this.completedCourses = completedCourses; }

    public int getOverallProgressPercentage() { return overallProgressPercentage; }
    public void setOverallProgressPercentage(int overallProgressPercentage) { this.overallProgressPercentage = overallProgressPercentage; }

    public List<LearningPathCourseDto> getCourses() { return courses; }
    public void setCourses(List<LearningPathCourseDto> courses) { this.courses = courses; }

    public List<String> getUncoveredSkillGaps() { return uncoveredSkillGaps; }
    public void setUncoveredSkillGaps(List<String> uncoveredSkillGaps) { this.uncoveredSkillGaps = uncoveredSkillGaps; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
