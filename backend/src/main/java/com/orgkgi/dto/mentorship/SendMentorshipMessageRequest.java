package com.orgkgi.dto.mentorship;

import jakarta.validation.constraints.NotBlank;

public class SendMentorshipMessageRequest {

    @NotBlank(message = "Message text cannot be empty")
    private String messageText;

    private String suggestionType = "NONE"; // NONE, LIVE_CLASS, MATERIAL, CUSTOM

    private Long suggestedLiveClassId;

    private Long suggestedMaterialId;

    private String attachmentUrl;

    private String attachmentName;

    private String attachmentType;

    public SendMentorshipMessageRequest() {}

    public SendMentorshipMessageRequest(String messageText) {
        this.messageText = messageText;
    }

    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }

    public String getSuggestionType() { return suggestionType; }
    public void setSuggestionType(String suggestionType) { this.suggestionType = suggestionType; }

    public Long getSuggestedLiveClassId() { return suggestedLiveClassId; }
    public void setSuggestedLiveClassId(Long suggestedLiveClassId) { this.suggestedLiveClassId = suggestedLiveClassId; }

    public Long getSuggestedMaterialId() { return suggestedMaterialId; }
    public void setSuggestedMaterialId(Long suggestedMaterialId) { this.suggestedMaterialId = suggestedMaterialId; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }

    public String getAttachmentType() { return attachmentType; }
    public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }
}

