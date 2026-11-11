package com.orgkgi.dto.employee;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class EmployeeProfileDto {

    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private Long currentJobRoleId;
    private String currentJobRoleTitle;
    private String currentJobRoleCode;
    private Long targetJobRoleId;
    private String targetJobRoleTitle;
    private String targetJobRoleCode;
    private Long managerId;
    private String managerFullName;
    private LocalDate hireDate;
    private Boolean mentorOptIn;
    private Integer mentorAvailabilityHrsPerWeek;
    private Integer currentMenteeCount;
    private Integer maxMentees;
    private boolean eligibleForMentorship;
    private String resumeFileName;
    private String resumeContentType;
    private Long resumeFileSize;
    private java.time.OffsetDateTime resumeUploadedAt;
    private boolean hasResume;
    private List<EmployeeSkillDto> skills = new ArrayList<>();

    public EmployeeProfileDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }

    public Long getCurrentJobRoleId() { return currentJobRoleId; }
    public void setCurrentJobRoleId(Long currentJobRoleId) { this.currentJobRoleId = currentJobRoleId; }

    public String getCurrentJobRoleTitle() { return currentJobRoleTitle; }
    public void setCurrentJobRoleTitle(String currentJobRoleTitle) { this.currentJobRoleTitle = currentJobRoleTitle; }

    public String getCurrentJobRoleCode() { return currentJobRoleCode; }
    public void setCurrentJobRoleCode(String currentJobRoleCode) { this.currentJobRoleCode = currentJobRoleCode; }

    public Long getTargetJobRoleId() { return targetJobRoleId; }
    public void setTargetJobRoleId(Long targetJobRoleId) { this.targetJobRoleId = targetJobRoleId; }

    public String getTargetJobRoleTitle() { return targetJobRoleTitle; }
    public void setTargetJobRoleTitle(String targetJobRoleTitle) { this.targetJobRoleTitle = targetJobRoleTitle; }

    public String getTargetJobRoleCode() { return targetJobRoleCode; }
    public void setTargetJobRoleCode(String targetJobRoleCode) { this.targetJobRoleCode = targetJobRoleCode; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerFullName() { return managerFullName; }
    public void setManagerFullName(String managerFullName) { this.managerFullName = managerFullName; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public Boolean getMentorOptIn() { return mentorOptIn; }
    public void setMentorOptIn(Boolean mentorOptIn) { this.mentorOptIn = mentorOptIn; }

    public Integer getMentorAvailabilityHrsPerWeek() { return mentorAvailabilityHrsPerWeek; }
    public void setMentorAvailabilityHrsPerWeek(Integer mentorAvailabilityHrsPerWeek) { this.mentorAvailabilityHrsPerWeek = mentorAvailabilityHrsPerWeek; }

    public Integer getCurrentMenteeCount() { return currentMenteeCount; }
    public void setCurrentMenteeCount(Integer currentMenteeCount) { this.currentMenteeCount = currentMenteeCount; }

    public Integer getMaxMentees() { return maxMentees; }
    public void setMaxMentees(Integer maxMentees) { this.maxMentees = maxMentees; }

    public boolean isEligibleForMentorship() { return eligibleForMentorship; }
    public void setEligibleForMentorship(boolean eligibleForMentorship) { this.eligibleForMentorship = eligibleForMentorship; }

    public List<EmployeeSkillDto> getSkills() { return skills; }
    public void setSkills(List<EmployeeSkillDto> skills) { this.skills = skills; }

    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }

    public String getResumeContentType() { return resumeContentType; }
    public void setResumeContentType(String resumeContentType) { this.resumeContentType = resumeContentType; }

    public Long getResumeFileSize() { return resumeFileSize; }
    public void setResumeFileSize(Long resumeFileSize) { this.resumeFileSize = resumeFileSize; }

    public java.time.OffsetDateTime getResumeUploadedAt() { return resumeUploadedAt; }
    public void setResumeUploadedAt(java.time.OffsetDateTime resumeUploadedAt) { this.resumeUploadedAt = resumeUploadedAt; }

    public boolean isHasResume() { return hasResume; }
    public void setHasResume(boolean hasResume) { this.hasResume = hasResume; }
}
