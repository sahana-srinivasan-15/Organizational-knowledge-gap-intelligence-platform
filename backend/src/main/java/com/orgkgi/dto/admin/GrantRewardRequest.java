package com.orgkgi.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class GrantRewardRequest {

    @NotNull
    private Long userId;

    private String recipientRole;

    @NotBlank
    private String rewardType;

    private Double amount;

    private String citation;

    public GrantRewardRequest() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }

    public String getRewardType() { return rewardType; }
    public void setRewardType(String rewardType) { this.rewardType = rewardType; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCitation() { return citation; }
    public void setCitation(String citation) { this.citation = citation; }
}

