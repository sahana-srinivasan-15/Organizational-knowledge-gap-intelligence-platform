package com.orgkgi.dto.mentorship;

import java.time.OffsetDateTime;

public class MentorshipMessageDto {

    private Long id;
    private Long assignmentId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private Boolean isCurrentUser;
    private String messageText;
    private String suggestionType;
    private SuggestedLiveClassSummary suggestedLiveClass;
    private SuggestedMaterialSummary suggestedMaterial;
    private String attachmentUrl;
    private String attachmentName;
    private String attachmentType;
    private OffsetDateTime createdAt;

    public MentorshipMessageDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }

    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public Boolean getIsCurrentUser() { return isCurrentUser; }
    public void setIsCurrentUser(Boolean isCurrentUser) { this.isCurrentUser = isCurrentUser; }

    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }

    public String getSuggestionType() { return suggestionType; }
    public void setSuggestionType(String suggestionType) { this.suggestionType = suggestionType; }

    public SuggestedLiveClassSummary getSuggestedLiveClass() { return suggestedLiveClass; }
    public void setSuggestedLiveClass(SuggestedLiveClassSummary suggestedLiveClass) { this.suggestedLiveClass = suggestedLiveClass; }

    public SuggestedMaterialSummary getSuggestedMaterial() { return suggestedMaterial; }
    public void setSuggestedMaterial(SuggestedMaterialSummary suggestedMaterial) { this.suggestedMaterial = suggestedMaterial; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }

    public String getAttachmentType() { return attachmentType; }
    public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public static class SuggestedLiveClassSummary {
        private Long id;
        private String title;
        private String instructorName;
        private OffsetDateTime scheduledAt;
        private String meetingUrl;

        public SuggestedLiveClassSummary() {}

        public SuggestedLiveClassSummary(Long id, String title, String instructorName, OffsetDateTime scheduledAt, String meetingUrl) {
            this.id = id;
            this.title = title;
            this.instructorName = instructorName;
            this.scheduledAt = scheduledAt;
            this.meetingUrl = meetingUrl;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getInstructorName() { return instructorName; }
        public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

        public OffsetDateTime getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(OffsetDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

        public String getMeetingUrl() { return meetingUrl; }
        public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
    }

    public static class SuggestedMaterialSummary {
        private Long id;
        private String title;
        private String skillName;
        private String materialType;
        private String url;
        private String difficultyLevel;

        public SuggestedMaterialSummary() {}

        public SuggestedMaterialSummary(Long id, String title, String skillName, String materialType, String url, String difficultyLevel) {
            this.id = id;
            this.title = title;
            this.skillName = skillName;
            this.materialType = materialType;
            this.url = url;
            this.difficultyLevel = difficultyLevel;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getSkillName() { return skillName; }
        public void setSkillName(String skillName) { this.skillName = skillName; }

        public String getMaterialType() { return materialType; }
        public void setMaterialType(String materialType) { this.materialType = materialType; }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public String getDifficultyLevel() { return difficultyLevel; }
        public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    }
}

