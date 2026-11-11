package com.orgkgi.dto.mentorship;

import java.util.ArrayList;
import java.util.List;

public class MentorCandidateDto {

    private Long mentorProfileId;
    private Long mentorUserId;
    private String mentorFullName;
    private String mentorEmail;
    private Long departmentId;
    private String departmentName;
    private String currentJobRoleTitle;
    private Integer availableHoursPerWeek;
    private Integer currentMenteeCount;
    private Integer maxMentees;
    private Integer remainingCapacity;

    // Normalized scores (0.0 to 1.0) and overall composite affinity score
    private Double overallScore;
    private Double skillAffinityScore;
    private Double availabilityScore;
    private Double capacityScore;
    private Double departmentAffinityScore;

    private String explanation;
    private List<MatchedSkillDto> matchedSkills = new ArrayList<>();

    public MentorCandidateDto() {}

    public Long getMentorProfileId() { return mentorProfileId; }
    public void setMentorProfileId(Long mentorProfileId) { this.mentorProfileId = mentorProfileId; }

    public Long getMentorUserId() { return mentorUserId; }
    public void setMentorUserId(Long mentorUserId) { this.mentorUserId = mentorUserId; }

    public String getMentorFullName() { return mentorFullName; }
    public void setMentorFullName(String mentorFullName) { this.mentorFullName = mentorFullName; }

    public String getMentorEmail() { return mentorEmail; }
    public void setMentorEmail(String mentorEmail) { this.mentorEmail = mentorEmail; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getCurrentJobRoleTitle() { return currentJobRoleTitle; }
    public void setCurrentJobRoleTitle(String currentJobRoleTitle) { this.currentJobRoleTitle = currentJobRoleTitle; }

    public Integer getAvailableHoursPerWeek() { return availableHoursPerWeek; }
    public void setAvailableHoursPerWeek(Integer availableHoursPerWeek) { this.availableHoursPerWeek = availableHoursPerWeek; }

    public Integer getCurrentMenteeCount() { return currentMenteeCount; }
    public void setCurrentMenteeCount(Integer currentMenteeCount) { this.currentMenteeCount = currentMenteeCount; }

    public Integer getMaxMentees() { return maxMentees; }
    public void setMaxMentees(Integer maxMentees) { this.maxMentees = maxMentees; }

    public Integer getRemainingCapacity() { return remainingCapacity; }
    public void setRemainingCapacity(Integer remainingCapacity) { this.remainingCapacity = remainingCapacity; }

    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }

    public Double getSkillAffinityScore() { return skillAffinityScore; }
    public void setSkillAffinityScore(Double skillAffinityScore) { this.skillAffinityScore = skillAffinityScore; }

    public Double getAvailabilityScore() { return availabilityScore; }
    public void setAvailabilityScore(Double availabilityScore) { this.availabilityScore = availabilityScore; }

    public Double getCapacityScore() { return capacityScore; }
    public void setCapacityScore(Double capacityScore) { this.capacityScore = capacityScore; }

    public Double getDepartmentAffinityScore() { return departmentAffinityScore; }
    public void setDepartmentAffinityScore(Double departmentAffinityScore) { this.departmentAffinityScore = departmentAffinityScore; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public List<MatchedSkillDto> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<MatchedSkillDto> matchedSkills) { this.matchedSkills = matchedSkills; }
}
