package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.liveclass.CreateLiveClassRequest;
import com.orgkgi.dto.liveclass.LiveClassDto;
import com.orgkgi.dto.liveclass.UpdateLiveClassStatusRequest;
import com.orgkgi.service.LiveClassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/live-classes")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Live Interactive Classes", description = "Live virtual classes, webinars, interactive Q&A sessions, and recording archives")
public class LiveClassController {

    private final LiveClassService liveClassService;

    public LiveClassController(LiveClassService liveClassService) {
        this.liveClassService = liveClassService;
    }

    @GetMapping
    @Operation(summary = "List live classes filtered by status (LIVE, UPCOMING, COMPLETED) and optional skill")
    public ResponseEntity<ApiResponse<List<LiveClassDto>>> getLiveClasses(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long skillId) {
        List<LiveClassDto> list = liveClassService.getLiveClasses(status, skillId);
        return ResponseEntity.ok(ApiResponse.success("Live classes retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get live class details by ID")
    public ResponseEntity<ApiResponse<LiveClassDto>> getLiveClassById(@PathVariable Long id) {
        LiveClassDto dto = liveClassService.getLiveClassById(id);
        return ResponseEntity.ok(ApiResponse.success("Live class retrieved successfully", dto));
    }

    @PostMapping
    @Operation(summary = "Schedule a new live class (Mentors, Managers, and Admins)")
    public ResponseEntity<ApiResponse<LiveClassDto>> createLiveClass(
            @Valid @RequestBody CreateLiveClassRequest request) {
        LiveClassDto dto = liveClassService.createLiveClass(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Live class scheduled successfully", dto));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update live class status (e.g. go LIVE, mark COMPLETED)")
    public ResponseEntity<ApiResponse<LiveClassDto>> updateLiveClassStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLiveClassStatusRequest request) {
        LiveClassDto dto = liveClassService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Live class status updated successfully", dto));
    }

    @PostMapping("/{id}/join")
    @Operation(summary = "Join live class and increment attendee count")
    public ResponseEntity<ApiResponse<LiveClassDto>> joinLiveClass(@PathVariable Long id) {
        LiveClassDto dto = liveClassService.joinClass(id);
        return ResponseEntity.ok(ApiResponse.success("Joined live class successfully", dto));
    }
}

