package com.orgkgi.dto.admin;

import jakarta.validation.constraints.NotNull;

public class AcceptReasonRequest {

    @NotNull
    private Long userId;

    private Integer extensionDays = 30;

    private String approvalNotes;

    public AcceptReasonRequest() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Integer getExtensionDays() { return extensionDays; }
    public void setExtensionDays(Integer extensionDays) { this.extensionDays = extensionDays; }

    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }
}

