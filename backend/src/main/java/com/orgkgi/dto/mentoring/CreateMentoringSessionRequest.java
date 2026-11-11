package com.orgkgi.dto.mentoring;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateMentoringSessionRequest {

    @NotNull(message = "Mentor assignment ID is required")
    private Long mentorAssignmentId;

    @NotBlank(message = "Session topic is required")
    private String topic;

    @NotNull(message = "Session date is required")
    private LocalDate sessionDate;

    private Integer durationMinutes = 45;

    private String notes;

    private String feedback;

    private String actionItems;

    private String status = "COMPLETED";

    private LocalDate nextSessionDate;

    public CreateMentoringSessionRequest() {}

    public Long getMentorAssignmentId() { return mentorAssignmentId; }
    public void setMentorAssignmentId(Long mentorAssignmentId) { this.mentorAssignmentId = mentorAssignmentId; }

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
}
