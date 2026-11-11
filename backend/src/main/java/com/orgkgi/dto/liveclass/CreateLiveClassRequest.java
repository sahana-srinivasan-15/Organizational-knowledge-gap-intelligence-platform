package com.orgkgi.dto.liveclass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public class CreateLiveClassRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Long skillId;

    @NotNull(message = "Scheduled time is required")
    private OffsetDateTime scheduledAt;

    private Integer durationMinutes = 60;

    @NotBlank(message = "Meeting URL is required")
    private String meetingUrl;

    private String materialsUrl;

    private Integer maxParticipants = 50;

    public CreateLiveClassRequest() {}

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getSkillId() {
        return skillId;
    }

    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }

    public OffsetDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(OffsetDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getMeetingUrl() {
        return meetingUrl;
    }

    public void setMeetingUrl(String meetingUrl) {
        this.meetingUrl = meetingUrl;
    }

    public String getMaterialsUrl() {
        return materialsUrl;
    }

    public void setMaterialsUrl(String materialsUrl) {
        this.materialsUrl = materialsUrl;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(Integer maxParticipants) {
        this.maxParticipants = maxParticipants;
    }
}

