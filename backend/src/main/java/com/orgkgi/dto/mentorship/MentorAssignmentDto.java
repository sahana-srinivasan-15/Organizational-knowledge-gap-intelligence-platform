package com.orgkgi.dto.mentorship;

import com.orgkgi.entity.MentorAssignmentStatus;

import java.time.OffsetDateTime;

public class MentorAssignmentDto {

    private Long id;
    private Long menteeProfileId;
    private Long menteeUserId;
    private String menteeFullName;
    private String menteeEmail;

    private Long mentorProfileId;
    private Long mentorUserId;
    private String mentorFullName;
    private String mentorEmail;

    private Long skillId;
    private String skillName;
    private String skillCode;

    private MentorAssignmentStatus status;
    private Long managerId;
    private String managerFullName;

    private OffsetDateTime assignedAt;
    private OffsetDateTime completedAt;
    private String notes;
    private OffsetDateTime createdAt;

    public MentorAssignmentDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMenteeProfileId() { return menteeProfileId; }
    public void setMenteeProfileId(Long menteeProfileId) { this.menteeProfileId = menteeProfileId; }

    public Long getMenteeUserId() { return menteeUserId; }
    public void setMenteeUserId(Long menteeUserId) { this.menteeUserId = menteeUserId; }

    public String getMenteeFullName() { return menteeFullName; }
    public void setMenteeFullName(String menteeFullName) { this.menteeFullName = menteeFullName; }

    public String getMenteeEmail() { return menteeEmail; }
    public void setMenteeEmail(String menteeEmail) { this.menteeEmail = menteeEmail; }

    public Long getMentorProfileId() { return mentorProfileId; }
    public void setMentorProfileId(Long mentorProfileId) { this.mentorProfileId = mentorProfileId; }

    public Long getMentorUserId() { return mentorUserId; }
    public void setMentorUserId(Long mentorUserId) { this.mentorUserId = mentorUserId; }

    public String getMentorFullName() { return mentorFullName; }
    public void setMentorFullName(String mentorFullName) { this.mentorFullName = mentorFullName; }

    public String getMentorEmail() { return mentorEmail; }
    public void setMentorEmail(String mentorEmail) { this.mentorEmail = mentorEmail; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getSkillCode() { return skillCode; }
    public void setSkillCode(String skillCode) { this.skillCode = skillCode; }

    public MentorAssignmentStatus getStatus() { return status; }
    public void setStatus(MentorAssignmentStatus status) { this.status = status; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerFullName() { return managerFullName; }
    public void setManagerFullName(String managerFullName) { this.managerFullName = managerFullName; }

    public OffsetDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(OffsetDateTime assignedAt) { this.assignedAt = assignedAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
