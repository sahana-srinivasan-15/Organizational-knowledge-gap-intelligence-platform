package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.mentorship.MentorshipMessageDto;
import com.orgkgi.dto.mentorship.SendMentorshipMessageRequest;
import com.orgkgi.service.MentorshipChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mentorship-chat")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Mentorship Chat & Suggestions", description = "Direct interactive chat and learning suggestions between peer mentors and mentees")
public class MentorshipChatController {

    private final MentorshipChatService chatService;

    public MentorshipChatController(MentorshipChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/{assignmentId}/messages")
    @Operation(summary = "Get all messages and suggestions for a mentorship connection")
    public ResponseEntity<ApiResponse<List<MentorshipMessageDto>>> getMessages(@PathVariable Long assignmentId) {
        List<MentorshipMessageDto> messages = chatService.getMessages(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved successfully", messages));
    }

    @PostMapping("/{assignmentId}/messages")
    @Operation(summary = "Send a new message or learning suggestion to mentee/mentor")
    public ResponseEntity<ApiResponse<MentorshipMessageDto>> sendMessage(
            @PathVariable Long assignmentId,
            @Valid @RequestBody SendMentorshipMessageRequest request) {
        MentorshipMessageDto sent = chatService.sendMessage(assignmentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Message sent successfully", sent));
    }
}

