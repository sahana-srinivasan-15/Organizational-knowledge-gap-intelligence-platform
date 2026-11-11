package com.orgkgi.dto.mentorship;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RejectAssignmentRequest {

    @NotBlank(message = "Rejection reason is required")
    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    private String reason;

    public RejectAssignmentRequest() {}

    public RejectAssignmentRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
