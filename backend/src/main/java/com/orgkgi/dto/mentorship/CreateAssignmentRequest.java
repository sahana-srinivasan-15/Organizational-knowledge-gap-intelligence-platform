package com.orgkgi.dto.mentorship;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateAssignmentRequest {

    @NotNull(message = "Mentee employee profile ID is required")
    private Long menteeProfileId;

    @NotNull(message = "Mentor employee profile ID is required")
    private Long mentorProfileId;

    @NotNull(message = "Target skill ID is required")
    private Long skillId;

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;

    public CreateAssignmentRequest() {}

    public CreateAssignmentRequest(Long menteeProfileId, Long mentorProfileId, Long skillId, String notes) {
        this.menteeProfileId = menteeProfileId;
        this.mentorProfileId = mentorProfileId;
        this.skillId = skillId;
        this.notes = notes;
    }

    public Long getMenteeProfileId() { return menteeProfileId; }
    public void setMenteeProfileId(Long menteeProfileId) { this.menteeProfileId = menteeProfileId; }
    public Long getMenteeId() { return menteeProfileId; }
    public void setMenteeId(Long menteeId) { this.menteeProfileId = menteeId; }

    public Long getMentorProfileId() { return mentorProfileId; }
    public void setMentorProfileId(Long mentorProfileId) { this.mentorProfileId = mentorProfileId; }
    public Long getMentorId() { return mentorProfileId; }
    public void setMentorId(Long mentorId) { this.mentorProfileId = mentorId; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
