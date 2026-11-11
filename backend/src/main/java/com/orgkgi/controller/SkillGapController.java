package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.skillgap.ConductResumeAssessmentRequest;
import com.orgkgi.dto.skillgap.ConductResumeAssessmentResponseDto;
import com.orgkgi.dto.skillgap.SendGapReportRequest;
import com.orgkgi.dto.skillgap.SendGapReportResponseDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.service.SkillGapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/skills/gaps")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Skill Gap Intelligence", description = "Deterministic skill gap evaluation against target job roles")
public class SkillGapController {

    private final SkillGapService skillGapService;

    public SkillGapController(SkillGapService skillGapService) {
        this.skillGapService = skillGapService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current employee's verified skill gap report against target job role")
    public ResponseEntity<ApiResponse<SkillGapReportDto>> getOwnSkillGapReport() {
        SkillGapReportDto report = skillGapService.getSkillGapReportForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/employee/{employeeProfileId}")
    @Operation(summary = "Get employee skill gap report by profile ID (Authorized managers or administrators)")
    public ResponseEntity<ApiResponse<SkillGapReportDto>> getEmployeeSkillGapReport(@PathVariable Long employeeProfileId) {
        SkillGapReportDto report = skillGapService.getSkillGapReportForEmployee(employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/conduct-resume-assessment")
    @Operation(summary = "Conduct diagnostic skill assessment based on employee resume and update verified skill levels")
    public ResponseEntity<ApiResponse<ConductResumeAssessmentResponseDto>> conductResumeAssessment(
            @RequestBody(required = false) ConductResumeAssessmentRequest request) {
        ConductResumeAssessmentResponseDto response = skillGapService.conductResumeAssessment(request);
        return ResponseEntity.ok(ApiResponse.success("Resume diagnostic assessment completed successfully", response));
    }

    @PostMapping("/send-to-manager")
    @Operation(summary = "Send employee assessment score, verified skills, and knowledge gap report to assigned manager")
    public ResponseEntity<ApiResponse<SendGapReportResponseDto>> sendGapReportToManager(
            @RequestBody(required = false) SendGapReportRequest request) {
        SendGapReportResponseDto response = skillGapService.sendGapReportToManager(request);
        return ResponseEntity.ok(ApiResponse.success("Assessment score and gap analysis report successfully delivered to manager", response));
    }

    @PostMapping("/reset-journey")
    @Operation(summary = "Reset employee diagnostic journey and skills back to fresh baseline")
    public ResponseEntity<ApiResponse<String>> resetMyJourney() {
        SkillGapReportDto report = skillGapService.getSkillGapReportForCurrentUser();
        skillGapService.resetEmployeeJourney(report.getEmployeeProfileId());
        return ResponseEntity.ok(ApiResponse.success("Diagnostic journey and employee skills successfully reset to clean baseline", "RESET_COMPLETE"));
    }
}
