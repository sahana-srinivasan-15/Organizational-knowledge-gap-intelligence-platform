package com.orgkgi.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "mentorship_messages")
public class MentorshipMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentor_assignment_id", nullable = false)
    private MentorAssignment mentorAssignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Column(name = "suggestion_type", length = 50)
    private String suggestionType = "NONE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggested_live_class_id")
    private LiveClass suggestedLiveClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggested_material_id")
    private SkillMaterial suggestedMaterial;

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Column(name = "attachment_type", length = 50)
    private String attachmentType; // IMAGE, DOCUMENT, FILE, NONE

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public MentorshipMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MentorAssignment getMentorAssignment() { return mentorAssignment; }
    public void setMentorAssignment(MentorAssignment mentorAssignment) { this.mentorAssignment = mentorAssignment; }

    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }

    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }

    public String getSuggestionType() { return suggestionType; }
    public void setSuggestionType(String suggestionType) { this.suggestionType = suggestionType; }

    public LiveClass getSuggestedLiveClass() { return suggestedLiveClass; }
    public void setSuggestedLiveClass(LiveClass suggestedLiveClass) { this.suggestedLiveClass = suggestedLiveClass; }

    public SkillMaterial getSuggestedMaterial() { return suggestedMaterial; }
    public void setSuggestedMaterial(SkillMaterial suggestedMaterial) { this.suggestedMaterial = suggestedMaterial; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }

    public String getAttachmentType() { return attachmentType; }
    public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}

