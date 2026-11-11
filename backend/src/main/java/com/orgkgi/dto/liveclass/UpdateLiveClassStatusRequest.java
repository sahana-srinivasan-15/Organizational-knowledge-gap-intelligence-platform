package com.orgkgi.dto.liveclass;

import jakarta.validation.constraints.NotBlank;

public class UpdateLiveClassStatusRequest {

    @NotBlank(message = "Status is required")
    private String status; // UPCOMING, LIVE, COMPLETED, CANCELLED

    private String recordingUrl;

    public UpdateLiveClassStatusRequest() {}

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRecordingUrl() {
        return recordingUrl;
    }

    public void setRecordingUrl(String recordingUrl) {
        this.recordingUrl = recordingUrl;
    }
}

