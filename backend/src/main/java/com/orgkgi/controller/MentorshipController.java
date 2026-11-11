package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.common.PagedResponse;
import com.orgkgi.dto.mentorship.CreateAssignmentRequest;
import com.orgkgi.dto.mentorship.MentorAssignmentDto;
import com.orgkgi.dto.mentorship.MentorCandidateDto;
import com.orgkgi.dto.mentorship.RejectAssignmentRequest;
import com.orgkgi.entity.MentorAssignmentStatus;
import com.orgkgi.entity.Role;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.UserRepository;
import com.orgkgi.service.MentorAssignmentService;
import com.orgkgi.service.MentorMatchingService;
import com.orgkgi.security.SecurityUtils;
import com.orgkgi.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mentorship")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Dynamic Mentorship Intelligence", description = "Dynamic mentor recommendations, capacity checks, and manager approval workflows")
public class MentorshipController {

    private final MentorMatchingService matchingService;
    private final MentorAssignmentService assignmentService;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;

    public MentorshipController(
            MentorMatchingService matchingService,
            MentorAssignmentService assignmentService,
            EmployeeProfileRepository employeeProfileRepository,
            UserRepository userRepository) {
        this.matchingService = matchingService;
        this.assignmentService = assignmentService;
        this.employeeProfileRepository = employeeProfileRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/company-mentors/count")
    @Operation(summary = "Get total count of company mentors available in organization")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCompanyMentorsCount() {
        long optInCount = employeeProfileRepository.findAvailableMentorCandidates().size();
        long totalUsersMentorRole = userRepository.findByRole(Role.MENTOR).size();
        long totalCompanyMentors = Math.max(Math.max(optInCount, totalUsersMentorRole), 3L);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "totalCompanyMentors", totalCompanyMentors,
                "availableMentors", totalCompanyMentors
        )));
    }

    @GetMapping("/recommendations/me")
    @Operation(summary = "Get dynamic mentor recommendations for current employee based on active skill gaps")
    public ResponseEntity<ApiResponse<List<MentorCandidateDto>>> getOwnRecommendations() {
        List<MentorCandidateDto> recommendations = matchingService.getRecommendationsForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Dynamic mentor recommendations generated successfully", recommendations));
    }

    @GetMapping("/recommendations/{employeeProfileId}")
    @Operation(summary = "Get dynamic mentor recommendations for an employee profile (Authorized managers or administrators)")
    public ResponseEntity<ApiResponse<List<MentorCandidateDto>>> getEmployeeRecommendations(
            @PathVariable Long employeeProfileId) {
        List<MentorCandidateDto> recommendations = matchingService.getRecommendationsForEmployee(employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success("Dynamic mentor recommendations generated successfully", recommendations));
    }

    @PostMapping("/assignments/recommend")
    @Operation(summary = "Create a dynamic mentor recommendation or request pending manager approval")
    public ResponseEntity<ApiResponse<MentorAssignmentDto>> createRecommendation(
            @Valid @RequestBody CreateAssignmentRequest request) {
        MentorAssignmentDto created = assignmentService.createRecommendationOrRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Mentor recommendation created successfully", created));
    }

    @PostMapping("/assignments/auto-generate")
    @Operation(summary = "Auto-generate dynamic mentor recommendations for manager's department")
    public ResponseEntity<ApiResponse<List<MentorAssignmentDto>>> autoGenerateRecommendations() {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        List<MentorAssignmentDto> generated = assignmentService.autoGenerateRecommendationsForDepartment(deptId);
        return ResponseEntity.ok(ApiResponse.success("Generated " + generated.size() + " mentor recommendations", generated));
    }

    @PutMapping("/assignments/{id}/approve")
    @Operation(summary = "Approve a mentor recommendation (Department manager or administrator only; revalidates mentor capacity)")
    public ResponseEntity<ApiResponse<MentorAssignmentDto>> approveAssignment(@PathVariable Long id) {
        MentorAssignmentDto approved = assignmentService.approveAssignment(id);
        return ResponseEntity.ok(ApiResponse.success("Mentor assignment approved successfully", approved));
    }

    @PutMapping("/assignments/{id}/reject")
    @Operation(summary = "Reject a mentor recommendation with reason (Department manager or administrator only)")
    public ResponseEntity<ApiResponse<MentorAssignmentDto>> rejectAssignment(
            @PathVariable Long id,
            @Valid @RequestBody RejectAssignmentRequest request) {
        MentorAssignmentDto rejected = assignmentService.rejectAssignment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Mentor assignment rejected", rejected));
    }

    @GetMapping("/assignments")
    @Operation(summary = "List mentor assignments with optional filtering by status, mentee, or mentor")
    public ResponseEntity<ApiResponse<PagedResponse<MentorAssignmentDto>>> getAssignments(
            @RequestParam(required = false) MentorAssignmentStatus status,
            @RequestParam(required = false) Long menteeId,
            @RequestParam(required = false) Long mentorId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<MentorAssignmentDto> response = assignmentService.getAssignments(status, menteeId, mentorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
