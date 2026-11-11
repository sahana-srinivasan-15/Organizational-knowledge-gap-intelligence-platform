package com.orgkgi.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AppreciatePersonnelRequest {

    @NotNull
    private Long userId;

    private String recipientRole;

    @NotBlank
    private String message;

    private String badgeCategory;

    public AppreciatePersonnelRequest() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getBadgeCategory() { return badgeCategory; }
    public void setBadgeCategory(String badgeCategory) { this.badgeCategory = badgeCategory; }
}

