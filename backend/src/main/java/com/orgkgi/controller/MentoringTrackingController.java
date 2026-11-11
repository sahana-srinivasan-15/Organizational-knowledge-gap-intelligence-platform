package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.mentoring.CreateMentoringSessionRequest;
import com.orgkgi.dto.mentoring.CreateMilestoneRequest;
import com.orgkgi.dto.mentoring.LearningMilestoneDto;
import com.orgkgi.dto.mentoring.MentoringSessionDto;
import com.orgkgi.service.MentoringTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mentoring-tracking")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Mentoring Tracking & Sessions", description = "PostgreSQL-backed mentoring session logs, learning milestones, and mentee progress tracking")
public class MentoringTrackingController {

    private final MentoringTrackingService trackingService;

    public MentoringTrackingController(MentoringTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @GetMapping("/assignments/{assignmentId}/sessions")
    @Operation(summary = "Get all persistent mentoring sessions for an assignment (Authorized mentor, mentee, or manager)")
    public ResponseEntity<ApiResponse<List<MentoringSessionDto>>> getSessions(
            @PathVariable Long assignmentId) {

        List<MentoringSessionDto> sessions = trackingService.getSessionsForAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @PostMapping("/sessions")
    @Operation(summary = "Record a completed or scheduled mentoring session with feedback and action items (Assigned mentor or admin)")
    public ResponseEntity<ApiResponse<MentoringSessionDto>> createSession(
            @Valid @RequestBody CreateMentoringSessionRequest request) {

        MentoringSessionDto session = trackingService.createSession(request);
        return ResponseEntity.ok(ApiResponse.success("Mentoring session recorded successfully", session));
    }

    @GetMapping("/assignments/{assignmentId}/milestones")
    @Operation(summary = "Get learning milestones and tasks for an assignment")
    public ResponseEntity<ApiResponse<List<LearningMilestoneDto>>> getMilestones(
            @PathVariable Long assignmentId) {

        List<LearningMilestoneDto> milestones = trackingService.getMilestonesForAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(milestones));
    }

    @PostMapping("/milestones")
    @Operation(summary = "Define a new learning milestone or task for mentee upskilling")
    public ResponseEntity<ApiResponse<LearningMilestoneDto>> createMilestone(
            @Valid @RequestBody CreateMilestoneRequest request) {

        LearningMilestoneDto milestone = trackingService.createMilestone(request);
        return ResponseEntity.ok(ApiResponse.success("Milestone created successfully", milestone));
    }

    @PatchMapping("/milestones/{milestoneId}/status")
    @Operation(summary = "Update milestone progress or mark completed")
    public ResponseEntity<ApiResponse<LearningMilestoneDto>> updateMilestoneStatus(
            @PathVariable Long milestoneId,
            @RequestParam String status) {

        LearningMilestoneDto milestone = trackingService.toggleMilestoneStatus(milestoneId, status);
        return ResponseEntity.ok(ApiResponse.success("Milestone status updated", milestone));
    }
}
