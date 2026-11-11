package com.orgkgi.controller;

import com.orgkgi.dto.admin.*;
import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.service.AdminPerformanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/performance")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Admin Performance & Talent Governance", description = "Endpoints for employee performance tracking, top performer rewards, and low performer manager inquiries / escalations")
public class AdminPerformanceController {

    private final AdminPerformanceService adminPerformanceService;

    public AdminPerformanceController(AdminPerformanceService adminPerformanceService) {
        this.adminPerformanceService = adminPerformanceService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get comprehensive employee, manager, and mentor performance metrics (Admin only)")
    public ResponseEntity<ApiResponse<List<EmployeePerformanceDto>>> getPerformanceOverview() {
        List<EmployeePerformanceDto> overview = adminPerformanceService.getPerformanceOverview();
        return ResponseEntity.ok(ApiResponse.success("Performance roster retrieved successfully", overview));
    }

    @PostMapping("/inquire-manager")
    @Operation(summary = "Dispatch formal performance/attendance inquiry to an employee's manager (Admin only)")
    public ResponseEntity<ApiResponse<EmployeePerformanceDto>> inquireManager(@Valid @RequestBody InquireManagerRequest request) {
        EmployeePerformanceDto updated = adminPerformanceService.inquireManager(request);
        return ResponseEntity.ok(ApiResponse.success("Manager inquiry dispatched successfully", updated));
    }

    @PostMapping("/accept-reason")
    @Operation(summary = "Accept manager justification for low readiness or assessment non-attendance (Admin only)")
    public ResponseEntity<ApiResponse<EmployeePerformanceDto>> acceptReason(@Valid @RequestBody AcceptReasonRequest request) {
        EmployeePerformanceDto updated = adminPerformanceService.acceptReason(request);
        return ResponseEntity.ok(ApiResponse.success("Manager justification accepted and extension granted", updated));
    }

    @PostMapping("/reward")
    @Operation(summary = "Grant corporate reward (Spot bonus, certificate, promotion nomination, plaque) to top performer (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> grantReward(@Valid @RequestBody GrantRewardRequest request) {
        Map<String, Object> result = adminPerformanceService.grantReward(request);
        return ResponseEntity.ok(ApiResponse.success("Corporate reward successfully granted", result));
    }

    @PostMapping("/appreciate")
    @Operation(summary = "Send official executive appreciation and praise note to personnel (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> appreciatePersonnel(@Valid @RequestBody AppreciatePersonnelRequest request) {
        Map<String, Object> result = adminPerformanceService.appreciatePersonnel(request);
        return ResponseEntity.ok(ApiResponse.success("Executive appreciation sent successfully", result));
    }
}

