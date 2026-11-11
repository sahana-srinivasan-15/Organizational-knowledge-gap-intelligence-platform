package com.orgkgi.dto.mentoring;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class MentoringSessionDto {

    private Long id;
    private Long mentorAssignmentId;
    private Long menteeProfileId;
    private String menteeFullName;
    private Long mentorProfileId;
    private String mentorFullName;
    private String skillName;

    private String topic;
    private LocalDate sessionDate;
    private Integer durationMinutes;
    private String notes;
    private String feedback;
    private String actionItems;
    private String status;
    private LocalDate nextSessionDate;
    private OffsetDateTime createdAt;

    public MentoringSessionDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMentorAssignmentId() { return mentorAssignmentId; }
    public void setMentorAssignmentId(Long mentorAssignmentId) { this.mentorAssignmentId = mentorAssignmentId; }

    public Long getMenteeProfileId() { return menteeProfileId; }
    public void setMenteeProfileId(Long menteeProfileId) { this.menteeProfileId = menteeProfileId; }

    public String getMenteeFullName() { return menteeFullName; }
    public void setMenteeFullName(String menteeFullName) { this.menteeFullName = menteeFullName; }

    public Long getMentorProfileId() { return mentorProfileId; }
    public void setMentorProfileId(Long mentorProfileId) { this.mentorProfileId = mentorProfileId; }

    public String getMentorFullName() { return mentorFullName; }
    public void setMentorFullName(String mentorFullName) { this.mentorFullName = mentorFullName; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public String getActionItems() { return actionItems; }
    public void setActionItems(String actionItems) { this.actionItems = actionItems; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getNextSessionDate() { return nextSessionDate; }
    public void setNextSessionDate(LocalDate nextSessionDate) { this.nextSessionDate = nextSessionDate; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
