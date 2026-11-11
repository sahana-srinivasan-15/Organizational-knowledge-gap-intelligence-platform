package com.orgkgi.dto.skillgap;

import java.time.OffsetDateTime;

public class SendGapReportResponseDto {

    private Long managerId;
    private String managerName;
    private String managerEmail;
    private String employeeName;
    private String targetRole;
    private Double readinessScore;
    private Double testScore;
    private int verifiedSkillsCount;
    private int gapSkillsCount;
    private String criticalGapsSummary;
    private OffsetDateTime sentAt;
    private Long notificationId;
    private String message;

    public SendGapReportResponseDto() {}

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }

    public String getManagerEmail() { return managerEmail; }
    public void setManagerEmail(String managerEmail) { this.managerEmail = managerEmail; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public Double getReadinessScore() { return readinessScore; }
    public void setReadinessScore(Double readinessScore) { this.readinessScore = readinessScore; }

    public Double getTestScore() { return testScore; }
    public void setTestScore(Double testScore) { this.testScore = testScore; }

    public int getVerifiedSkillsCount() { return verifiedSkillsCount; }
    public void setVerifiedSkillsCount(int verifiedSkillsCount) { this.verifiedSkillsCount = verifiedSkillsCount; }

    public int getGapSkillsCount() { return gapSkillsCount; }
    public void setGapSkillsCount(int gapSkillsCount) { this.gapSkillsCount = gapSkillsCount; }

    public String getCriticalGapsSummary() { return criticalGapsSummary; }
    public void setCriticalGapsSummary(String criticalGapsSummary) { this.criticalGapsSummary = criticalGapsSummary; }

    public OffsetDateTime getSentAt() { return sentAt; }
    public void setSentAt(OffsetDateTime sentAt) { this.sentAt = sentAt; }

    public Long getNotificationId() { return notificationId; }
    public void setNotificationId(Long notificationId) { this.notificationId = notificationId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

