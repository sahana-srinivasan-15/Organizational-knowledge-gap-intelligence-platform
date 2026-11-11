package com.orgkgi.controller;

import com.orgkgi.dto.approval.CourseApprovalRequestDto;
import com.orgkgi.dto.approval.ReviewCourseApprovalRequest;
import com.orgkgi.dto.approval.SubmitCourseApprovalRequest;
import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.common.PagedResponse;
import com.orgkgi.entity.CourseApprovalStatus;
import com.orgkgi.service.CourseApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/course-approvals")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Course Approvals", description = "Employee course request submission, manager review, and learning path activation")
public class CourseApprovalController {

    private final CourseApprovalService approvalService;

    public CourseApprovalController(CourseApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping
    @Operation(summary = "Submit an external or catalog course approval request to manager")
    public ResponseEntity<ApiResponse<CourseApprovalRequestDto>> submitRequest(
            @Valid @RequestBody SubmitCourseApprovalRequest request) {

        CourseApprovalRequestDto result = approvalService.submitRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Course request submitted successfully for manager approval", result));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Review course request: Approve, Reject, or Request Changes (Authorized manager or admin)")
    public ResponseEntity<ApiResponse<CourseApprovalRequestDto>> reviewRequest(
            @PathVariable Long id,
            @Valid @RequestBody ReviewCourseApprovalRequest request) {

        CourseApprovalRequestDto result = approvalService.reviewRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success("Course approval decision recorded successfully", result));
    }

    @PutMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw a pending course approval request by the submitting employee")
    public ResponseEntity<ApiResponse<CourseApprovalRequestDto>> withdrawRequest(@PathVariable Long id) {
        CourseApprovalRequestDto result = approvalService.withdrawRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Course request withdrawn successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently delete a course approval request")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable Long id) {
        approvalService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Course request removed successfully", null));
    }

    @GetMapping("/me")
    @Operation(summary = "Get all course approval requests submitted by current authenticated employee")
    public ResponseEntity<ApiResponse<List<CourseApprovalRequestDto>>> getMyRequests() {
        List<CourseApprovalRequestDto> requests = approvalService.getMyRequests();
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/department")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Get course approval requests for manager's department with optional status filtering")
    public ResponseEntity<ApiResponse<PagedResponse<CourseApprovalRequestDto>>> getDepartmentRequests(
            @RequestParam(required = false) CourseApprovalStatus status,
            @RequestParam(required = false) Long employeeProfileId,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        PagedResponse<CourseApprovalRequestDto> response = approvalService.getDepartmentRequests(
                status, employeeProfileId, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course request details by ID")
    public ResponseEntity<ApiResponse<CourseApprovalRequestDto>> getRequestById(@PathVariable Long id) {
        CourseApprovalRequestDto result = approvalService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
