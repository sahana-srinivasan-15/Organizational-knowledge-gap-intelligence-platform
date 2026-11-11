package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.learningpath.LearningPathDto;
import com.orgkgi.dto.learningpath.LearningProgressUpdateDto;
import com.orgkgi.dto.learningpath.PlatformCourseEnrollmentRequest;
import com.orgkgi.dto.learningpath.PlatformCourseVerificationRequest;
import com.orgkgi.service.LearningPathService;
import com.orgkgi.service.PlatformLearningSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/learning-paths")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Learning Pathways", description = "Personalized learning path generation, sequential roadmap, and progress tracking")
public class LearningPathController {

    private final LearningPathService learningPathService;
    private final PlatformLearningSyncService platformLearningSyncService;

    public LearningPathController(
            LearningPathService learningPathService,
            PlatformLearningSyncService platformLearningSyncService) {
        this.learningPathService = learningPathService;
        this.platformLearningSyncService = platformLearningSyncService;
    }

    @PostMapping("/generate/me")
    @Operation(summary = "Generate and persist a personalized learning path for the authenticated employee")
    public ResponseEntity<ApiResponse<LearningPathDto>> generateOwnPath() {
        LearningPathDto path = learningPathService.generateLearningPathForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Learning path generated successfully", path));
    }

    @PostMapping("/sync/me")
    @Operation(summary = "Synchronize the active personalized learning path with the latest assessment levels and certificates")
    public ResponseEntity<ApiResponse<LearningPathDto>> syncOwnPath() {
        LearningPathDto path = learningPathService.synchronizeActiveLearningPathForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Learning path synchronized successfully", path));
    }

    @PostMapping({"/enroll/platform", "/enroll-platform"})
    @Operation(summary = "Enroll in an external platform course (e.g. Coursera) and integrate into active learning roadmap")
    public ResponseEntity<ApiResponse<LearningPathDto>> enrollFromPlatform(
            @Valid @RequestBody PlatformCourseEnrollmentRequest request) {
        LearningPathDto path = platformLearningSyncService.enrollFromPlatform(request);
        return ResponseEntity.ok(ApiResponse.success("Course enrolled from platform and added to learning roadmap", path));
    }

    @PostMapping({"/sync/platform", "/sync-platform"})
    @Operation(summary = "Synchronize all enrolled platform courses with external platform APIs")
    public ResponseEntity<ApiResponse<LearningPathDto>> syncPlatformCourses() {
        LearningPathDto path = platformLearningSyncService.syncAllPlatformEnrollmentsForCurrentEmployee();
        return ResponseEntity.ok(ApiResponse.success("Learning roadmap synchronized with platform progress", path));
    }

    @PostMapping("/courses/{courseId}/verify-platform")
    @Operation(summary = "Verify enrolled course completion directly against external platform credential records")
    public ResponseEntity<ApiResponse<LearningPathDto>> verifyPlatformCourse(
            @PathVariable Long courseId,
            @RequestBody(required = false) PlatformCourseVerificationRequest request) {
        LearningPathDto path = platformLearningSyncService.verifyPlatformCourseProgress(courseId, request);
        return ResponseEntity.ok(ApiResponse.success("Platform course progress verified successfully", path));
    }

    @PostMapping("/generate/employee/{employeeProfileId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Generate a personalized learning path for an employee (Manager within department or Admin)")
    public ResponseEntity<ApiResponse<LearningPathDto>> generateEmployeePath(@PathVariable Long employeeProfileId) {
        LearningPathDto path = learningPathService.generateLearningPathForEmployee(employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success("Learning path generated successfully", path));
    }

    @GetMapping("/me")
    @Operation(summary = "Get the active personalized learning path for the authenticated employee")
    public ResponseEntity<ApiResponse<LearningPathDto>> getOwnActivePath() {
        LearningPathDto path = learningPathService.getActiveLearningPathForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(path));
    }

    @GetMapping("/employee/{employeeProfileId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'MENTOR')")
    @Operation(summary = "Get the active learning path for an employee (Manager within department, Admin, or Mentor)")
    public ResponseEntity<ApiResponse<LearningPathDto>> getEmployeeActivePath(@PathVariable Long employeeProfileId) {
        LearningPathDto path = learningPathService.getActiveLearningPathForEmployee(employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success(path));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a learning path by its ID (Owner, Manager within department, or Admin)")
    public ResponseEntity<ApiResponse<LearningPathDto>> getPathById(@PathVariable Long id) {
        LearningPathDto path = learningPathService.getLearningPathById(id);
        return ResponseEntity.ok(ApiResponse.success(path));
    }

    @PatchMapping("/{id}/courses/{courseId}/progress")
    @Operation(summary = "Update learning progress for a specific course step (Owner employee or Admin)")
    public ResponseEntity<ApiResponse<LearningPathDto>> updateProgress(
            @PathVariable Long id,
            @PathVariable Long courseId,
            @Valid @RequestBody LearningProgressUpdateDto request) {
        LearningPathDto path = learningPathService.updateCourseProgress(id, courseId, request.getProgressPercentage());
        return ResponseEntity.ok(ApiResponse.success("Course progress updated successfully", path));
    }
}
