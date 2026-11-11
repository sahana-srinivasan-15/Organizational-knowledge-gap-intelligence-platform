package com.orgkgi.service;

import com.orgkgi.dto.mentorship.MentorshipMessageDto;
import com.orgkgi.dto.mentorship.SendMentorshipMessageRequest;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.exception.UnauthorizedAccessException;
import com.orgkgi.repository.LiveClassRepository;
import com.orgkgi.repository.MentorAssignmentRepository;
import com.orgkgi.repository.MentorshipMessageRepository;
import com.orgkgi.repository.SkillMaterialRepository;
import com.orgkgi.repository.UserRepository;
import com.orgkgi.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class MentorshipChatService {

    private final MentorshipMessageRepository messageRepository;
    private final MentorAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final LiveClassRepository liveClassRepository;
    private final SkillMaterialRepository skillMaterialRepository;
    private final NotificationService notificationService;

    public MentorshipChatService(
            MentorshipMessageRepository messageRepository,
            MentorAssignmentRepository assignmentRepository,
            UserRepository userRepository,
            LiveClassRepository liveClassRepository,
            SkillMaterialRepository skillMaterialRepository,
            NotificationService notificationService) {
        this.messageRepository = messageRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.liveClassRepository = liveClassRepository;
        this.skillMaterialRepository = skillMaterialRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<MentorshipMessageDto> getMessages(Long assignmentId) {
        MentorAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateAccessToAssignment(assignment, currentUserId);

        return messageRepository.findByMentorAssignmentIdOrderByCreatedAtAsc(assignmentId)
                .stream()
                .map(msg -> mapToDto(msg, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public MentorshipMessageDto sendMessage(Long assignmentId, SendMentorshipMessageRequest request) {
        MentorAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));

        if (assignment.getStatus() != MentorAssignmentStatus.APPROVED_BY_MANAGER &&
                assignment.getStatus() != MentorAssignmentStatus.ACTIVE) {
            throw new BadRequestException("Cannot send messages for inactive mentorship assignment (" + assignment.getStatus() + ").");
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        validateAccessToAssignment(assignment, currentUserId);

        MentorshipMessage message = new MentorshipMessage();
        message.setMentorAssignment(assignment);
        message.setSender(currentUser);
        message.setMessageText(request.getMessageText().trim());

        String suggestionType = request.getSuggestionType() != null ? request.getSuggestionType().toUpperCase().trim() : "NONE";
        message.setSuggestionType(suggestionType);
        message.setAttachmentUrl(request.getAttachmentUrl());
        message.setAttachmentName(request.getAttachmentName());
        message.setAttachmentType(request.getAttachmentType());

        LiveClass liveClass = null;
        if (request.getSuggestedLiveClassId() != null) {
            liveClass = liveClassRepository.findById(request.getSuggestedLiveClassId())
                    .orElse(null);
            message.setSuggestedLiveClass(liveClass);
            if (liveClass != null && "NONE".equals(suggestionType)) {
                message.setSuggestionType("LIVE_CLASS");
                suggestionType = "LIVE_CLASS";
            }
        }

        SkillMaterial material = null;
        if (request.getSuggestedMaterialId() != null) {
            material = skillMaterialRepository.findById(request.getSuggestedMaterialId())
                    .orElse(null);
            message.setSuggestedMaterial(material);
            if (material != null && "NONE".equals(suggestionType)) {
                message.setSuggestionType("MATERIAL");
                suggestionType = "MATERIAL";
            }
        }

        MentorshipMessage saved = messageRepository.save(message);

        // Send In-App Notification to the counterpart
        Long menteeUserId = assignment.getMentee() != null && assignment.getMentee().getUser() != null
                ? assignment.getMentee().getUser().getId() : null;
        Long mentorUserId = assignment.getMentor() != null && assignment.getMentor().getUser() != null
                ? assignment.getMentor().getUser().getId() : null;

        boolean isSenderMentor = Objects.equals(currentUserId, mentorUserId);

        if (isSenderMentor && menteeUserId != null) {
            User menteeUser = assignment.getMentee().getUser();
            if ("LIVE_CLASS".equals(suggestionType) && liveClass != null) {
                notificationService.createNotification(
                        menteeUser,
                        "Live Class Suggested: " + liveClass.getTitle(),
                        "Your mentor " + currentUser.getFullName() + " suggested attending the live class '" + liveClass.getTitle() + "'. Click to join.",
                        "LIVE_CLASS_SUGGESTION",
                        "/live-classes",
                        liveClass.getId(),
                        currentUser
                );
            } else if ("MATERIAL".equals(suggestionType) && material != null) {
                notificationService.createNotification(
                        menteeUser,
                        "Study Material Recommended: " + material.getTitle(),
                        "Your mentor " + currentUser.getFullName() + " recommended the study material '" + material.getTitle() + "' to bridge your skill gaps.",
                        "MATERIAL_SUGGESTION",
                        "/weak-areas",
                        material.getId(),
                        currentUser
                );
            } else {
                notificationService.createNotification(
                        menteeUser,
                        "New Message from Mentor " + currentUser.getFullName(),
                        truncateMessage(request.getMessageText(), 140),
                        "MENTOR_MESSAGE",
                        "/mentorship",
                        assignmentId,
                        currentUser
                );
            }
        } else if (!isSenderMentor && mentorUserId != null) {
            User mentorUser = assignment.getMentor().getUser();
            notificationService.createNotification(
                    mentorUser,
                    "New Message from Mentee " + currentUser.getFullName(),
                    truncateMessage(request.getMessageText(), 140),
                    "MENTOR_MESSAGE",
                    "/mentor/dashboard",
                    assignmentId,
                    currentUser
            );
        }

        return mapToDto(saved, currentUserId);
    }

    private void validateAccessToAssignment(MentorAssignment assignment, Long userId) {
        Long menteeUserId = assignment.getMentee() != null && assignment.getMentee().getUser() != null
                ? assignment.getMentee().getUser().getId() : null;
        Long mentorUserId = assignment.getMentor() != null && assignment.getMentor().getUser() != null
                ? assignment.getMentor().getUser().getId() : null;

        boolean isMentee = Objects.equals(userId, menteeUserId);
        boolean isMentor = Objects.equals(userId, mentorUserId);

        Role role = SecurityUtils.getCurrentUserRole();
        if (!isMentee && !isMentor && role != Role.ADMIN && role != Role.MANAGER) {
            throw new UnauthorizedAccessException("You are not authorized to view or send messages for this mentorship connection.");
        }
    }

    private String truncateMessage(String msg, int maxLength) {
        if (msg == null) return "";
        return msg.length() <= maxLength ? msg : msg.substring(0, maxLength - 3) + "...";
    }

    private MentorshipMessageDto mapToDto(MentorshipMessage entity, Long currentUserId) {
        MentorshipMessageDto dto = new MentorshipMessageDto();
        dto.setId(entity.getId());
        dto.setAssignmentId(entity.getMentorAssignment() != null ? entity.getMentorAssignment().getId() : null);

        if (entity.getSender() != null) {
            dto.setSenderId(entity.getSender().getId());
            dto.setSenderName(entity.getSender().getFullName());
            dto.setSenderRole(entity.getSender().getRole() != null ? entity.getSender().getRole().name() : "USER");
            dto.setIsCurrentUser(Objects.equals(entity.getSender().getId(), currentUserId));
        }

        dto.setMessageText(entity.getMessageText());
        dto.setSuggestionType(entity.getSuggestionType());
        dto.setAttachmentUrl(entity.getAttachmentUrl());
        dto.setAttachmentName(entity.getAttachmentName());
        dto.setAttachmentType(entity.getAttachmentType());

        if (entity.getSuggestedLiveClass() != null) {
            LiveClass lc = entity.getSuggestedLiveClass();
            String instructor = lc.getMentor() != null && lc.getMentor().getUser() != null
                    ? lc.getMentor().getUser().getFullName() : "Faculty Mentor";
            dto.setSuggestedLiveClass(new MentorshipMessageDto.SuggestedLiveClassSummary(
                    lc.getId(), lc.getTitle(), instructor, lc.getScheduledAt(), lc.getMeetingUrl()
            ));
        }

        if (entity.getSuggestedMaterial() != null) {
            SkillMaterial sm = entity.getSuggestedMaterial();
            String skill = sm.getSkill() != null ? sm.getSkill().getName() : "General";
            dto.setSuggestedMaterial(new MentorshipMessageDto.SuggestedMaterialSummary(
                    sm.getId(), sm.getTitle(), skill, sm.getMaterialType(), sm.getUrl(), sm.getDifficultyLevel()
            ));
        }

        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}

