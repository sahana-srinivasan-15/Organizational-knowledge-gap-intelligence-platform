package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.manager.ManagerOverviewDto;
import com.orgkgi.service.ManagerAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/manager/analytics")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Manager Analytics & Governance", description = "Real-time department team overview, learning KPIs, and skill gap summaries")
public class ManagerAnalyticsController {

    private final ManagerAnalyticsService analyticsService;

    public ManagerAnalyticsController(ManagerAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get aggregated department analytics, team member learning status, and priority skill gaps")
    public ResponseEntity<ApiResponse<ManagerOverviewDto>> getDepartmentOverview() {
        ManagerOverviewDto overview = analyticsService.getDepartmentOverview();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }
}
