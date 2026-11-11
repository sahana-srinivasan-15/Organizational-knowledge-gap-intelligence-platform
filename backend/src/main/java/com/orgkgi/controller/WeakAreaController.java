package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.weakarea.SubmitMaterialReviewRequest;
import com.orgkgi.dto.weakarea.SubmitMentorReviewFeedbackRequest;
import com.orgkgi.dto.weakarea.WeakAreaDto;
import com.orgkgi.dto.weakarea.WeakAreaReviewDto;
import com.orgkgi.service.WeakAreaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/weak-areas")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Employee Weak Areas & Remedial Learning", description = "Automatic detection of employee skill gaps, tailored study materials, employee reviews, and mentor feedback")
public class WeakAreaController {

    private final WeakAreaService weakAreaService;

    public WeakAreaController(WeakAreaService weakAreaService) {
        this.weakAreaService = weakAreaService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current employee's detected weak areas, tailored materials, and reviews")
    public ResponseEntity<ApiResponse<List<WeakAreaDto>>> getOwnWeakAreas() {
        List<WeakAreaDto> list = weakAreaService.getWeakAreasForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Weak areas retrieved successfully", list));
    }

    @GetMapping("/employee/{employeeProfileId}")
    @Operation(summary = "Get employee's weak areas, tailored materials, and reviews (For employee, manager, or mentor)")
    public ResponseEntity<ApiResponse<List<WeakAreaDto>>> getEmployeeWeakAreas(
            @PathVariable Long employeeProfileId) {
        List<WeakAreaDto> list = weakAreaService.getWeakAreasForEmployee(employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success("Employee weak areas retrieved successfully", list));
    }

    @PostMapping("/skill/{skillId}/review")
    @Operation(summary = "Employee submits rating and review for a tailored study material")
    public ResponseEntity<ApiResponse<WeakAreaReviewDto>> submitMaterialReview(
            @PathVariable Long skillId,
            @Valid @RequestBody SubmitMaterialReviewRequest request) {
        WeakAreaReviewDto dto = weakAreaService.submitEmployeeReview(skillId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Review submitted successfully", dto));
    }

    @PostMapping("/employee/{employeeProfileId}/skill/{skillId}/mentor-feedback")
    @Operation(summary = "Mentor submits advisory review feedback on mentee weak area")
    public ResponseEntity<ApiResponse<WeakAreaReviewDto>> submitMentorFeedback(
            @PathVariable Long employeeProfileId,
            @PathVariable Long skillId,
            @Valid @RequestBody SubmitMentorReviewFeedbackRequest request) {
        WeakAreaReviewDto dto = weakAreaService.submitMentorFeedback(employeeProfileId, skillId, request);
        return ResponseEntity.ok(ApiResponse.success("Mentor review feedback submitted successfully", dto));
    }
}

