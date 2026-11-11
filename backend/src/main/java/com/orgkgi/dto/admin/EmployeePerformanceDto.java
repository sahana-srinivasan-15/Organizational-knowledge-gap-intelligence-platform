package com.orgkgi.dto.admin;

import java.util.ArrayList;
import java.util.List;

public class EmployeePerformanceDto {

    private Long userId;
    private Long employeeProfileId;
    private String fullName;
    private String email;
    private String role;
    private String departmentName;
    private String currentJobRoleTitle;
    private String targetJobRoleTitle;
    private Long managerId;
    private String managerFullName;
    private String managerEmail;

    // Evaluation & Readiness Metrics
    private Double diagnosticTestScore;
    private Double readinessScorePercentage;
    private Integer verifiedSkillsCount = 0;
    private Integer gapSkillsCount = 0;
    private List<String> verifiedSkillNames = new ArrayList<>();
    private List<String> criticalGaps = new ArrayList<>();
    private String performanceTier; // TOP_PERFORMER, PROFICIENT, AT_RISK

    // Low Performer Escalation & Manager Inquiry Status
    private String escalationStatus = "NONE"; // NONE, INQUIRY_SENT, REASON_RECEIVED, REASON_ACCEPTED, TERMINATED
    private String inquiryReason;
    private String managerExplanation;
    private Integer extensionDays;

    // Corporate Recognition & Rewards History
    private List<String> awardedBadges = new ArrayList<>();
    private List<String> appreciationMessages = new ArrayList<>();

    public EmployeePerformanceDto() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getCurrentJobRoleTitle() { return currentJobRoleTitle; }
    public void setCurrentJobRoleTitle(String currentJobRoleTitle) { this.currentJobRoleTitle = currentJobRoleTitle; }

    public String getTargetJobRoleTitle() { return targetJobRoleTitle; }
    public void setTargetJobRoleTitle(String targetJobRoleTitle) { this.targetJobRoleTitle = targetJobRoleTitle; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerFullName() { return managerFullName; }
    public void setManagerFullName(String managerFullName) { this.managerFullName = managerFullName; }

    public String getManagerEmail() { return managerEmail; }
    public void setManagerEmail(String managerEmail) { this.managerEmail = managerEmail; }

    public Double getDiagnosticTestScore() { return diagnosticTestScore; }
    public void setDiagnosticTestScore(Double diagnosticTestScore) { this.diagnosticTestScore = diagnosticTestScore; }

    public Double getReadinessScorePercentage() { return readinessScorePercentage; }
    public void setReadinessScorePercentage(Double readinessScorePercentage) { this.readinessScorePercentage = readinessScorePercentage; }

    public Integer getVerifiedSkillsCount() { return verifiedSkillsCount; }
    public void setVerifiedSkillsCount(Integer verifiedSkillsCount) { this.verifiedSkillsCount = verifiedSkillsCount; }

    public Integer getGapSkillsCount() { return gapSkillsCount; }
    public void setGapSkillsCount(Integer gapSkillsCount) { this.gapSkillsCount = gapSkillsCount; }

    public List<String> getVerifiedSkillNames() { return verifiedSkillNames; }
    public void setVerifiedSkillNames(List<String> verifiedSkillNames) { this.verifiedSkillNames = verifiedSkillNames; }

    public List<String> getCriticalGaps() { return criticalGaps; }
    public void setCriticalGaps(List<String> criticalGaps) { this.criticalGaps = criticalGaps; }

    public String getPerformanceTier() { return performanceTier; }
    public void setPerformanceTier(String performanceTier) { this.performanceTier = performanceTier; }

    public String getEscalationStatus() { return escalationStatus; }
    public void setEscalationStatus(String escalationStatus) { this.escalationStatus = escalationStatus; }

    public String getInquiryReason() { return inquiryReason; }
    public void setInquiryReason(String inquiryReason) { this.inquiryReason = inquiryReason; }

    public String getManagerExplanation() { return managerExplanation; }
    public void setManagerExplanation(String managerExplanation) { this.managerExplanation = managerExplanation; }

    public Integer getExtensionDays() { return extensionDays; }
    public void setExtensionDays(Integer extensionDays) { this.extensionDays = extensionDays; }

    public List<String> getAwardedBadges() { return awardedBadges; }
    public void setAwardedBadges(List<String> awardedBadges) { this.awardedBadges = awardedBadges; }

    public List<String> getAppreciationMessages() { return appreciationMessages; }
    public void setAppreciationMessages(List<String> appreciationMessages) { this.appreciationMessages = appreciationMessages; }
}

