package com.orgkgi.dto.skillgap;

import java.util.ArrayList;
import java.util.List;

public class SkillGapReportDto {

    private Long employeeProfileId;
    private Long userId;
    private String employeeFullName;
    private String employeeEmail;
    private Long departmentId;
    private String departmentName;
    private Long currentJobRoleId;
    private String currentJobRoleTitle;
    private Long targetJobRoleId;
    private String targetJobRoleTitle;

    private int totalRequiredSkills;
    private int verifiedSkillsCount;
    private int gapSkillsCount;
    private int unassessedSkillsCount;
    private int unverifiedSelfReportedSkillsCount;

    private Double totalWeightedGap;
    private Double averageVerifiedProficiency;
    private Double readinessScorePercentage; // (sum of verified proficiency weights / sum of required proficiency weights) * 100
    private String weightCalculationMode = "DYNAMIC_COMPETENCY_MODEL";

    private List<SkillGapItemDto> skillGaps = new ArrayList<>();

    public SkillGapReportDto() {}

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmployeeFullName() { return employeeFullName; }
    public void setEmployeeFullName(String employeeFullName) { this.employeeFullName = employeeFullName; }

    public String getEmployeeEmail() { return employeeEmail; }
    public void setEmployeeEmail(String employeeEmail) { this.employeeEmail = employeeEmail; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public Long getCurrentJobRoleId() { return currentJobRoleId; }
    public void setCurrentJobRoleId(Long currentJobRoleId) { this.currentJobRoleId = currentJobRoleId; }

    public String getCurrentJobRoleTitle() { return currentJobRoleTitle; }
    public void setCurrentJobRoleTitle(String currentJobRoleTitle) { this.currentJobRoleTitle = currentJobRoleTitle; }

    public Long getTargetJobRoleId() { return targetJobRoleId; }
    public void setTargetJobRoleId(Long targetJobRoleId) { this.targetJobRoleId = targetJobRoleId; }

    public String getTargetJobRoleTitle() { return targetJobRoleTitle; }
    public void setTargetJobRoleTitle(String targetJobRoleTitle) { this.targetJobRoleTitle = targetJobRoleTitle; }

    public int getTotalRequiredSkills() { return totalRequiredSkills; }
    public void setTotalRequiredSkills(int totalRequiredSkills) { this.totalRequiredSkills = totalRequiredSkills; }

    public int getVerifiedSkillsCount() { return verifiedSkillsCount; }
    public void setVerifiedSkillsCount(int verifiedSkillsCount) { this.verifiedSkillsCount = verifiedSkillsCount; }

    public int getGapSkillsCount() { return gapSkillsCount; }
    public void setGapSkillsCount(int gapSkillsCount) { this.gapSkillsCount = gapSkillsCount; }

    public int getUnassessedSkillsCount() { return unassessedSkillsCount; }
    public void setUnassessedSkillsCount(int unassessedSkillsCount) { this.unassessedSkillsCount = unassessedSkillsCount; }

    public int getUnverifiedSelfReportedSkillsCount() { return unverifiedSelfReportedSkillsCount; }
    public void setUnverifiedSelfReportedSkillsCount(int unverifiedSelfReportedSkillsCount) { this.unverifiedSelfReportedSkillsCount = unverifiedSelfReportedSkillsCount; }

    public Double getTotalWeightedGap() { return totalWeightedGap; }
    public void setTotalWeightedGap(Double totalWeightedGap) { this.totalWeightedGap = totalWeightedGap; }

    public Double getAverageVerifiedProficiency() { return averageVerifiedProficiency; }
    public void setAverageVerifiedProficiency(Double averageVerifiedProficiency) { this.averageVerifiedProficiency = averageVerifiedProficiency; }

    public Double getReadinessScorePercentage() { return readinessScorePercentage; }
    public void setReadinessScorePercentage(Double readinessScorePercentage) { this.readinessScorePercentage = readinessScorePercentage; }

    public List<SkillGapItemDto> getSkillGaps() { return skillGaps; }
    public void setSkillGaps(List<SkillGapItemDto> skillGaps) { this.skillGaps = skillGaps; }

    public String getWeightCalculationMode() { return weightCalculationMode; }
    public void setWeightCalculationMode(String weightCalculationMode) { this.weightCalculationMode = weightCalculationMode; }
}
