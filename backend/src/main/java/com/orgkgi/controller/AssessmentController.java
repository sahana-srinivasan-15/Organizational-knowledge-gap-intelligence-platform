package com.orgkgi.controller;

import com.orgkgi.dto.assessment.*;
import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.entity.Assessment;
import com.orgkgi.service.AssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assessments")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Diagnostic Assessments", description = "Skill diagnostic testing, server-side scoring, and verified proficiency elevation")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @GetMapping
    @Operation(summary = "List all available diagnostic assessments")
    public ResponseEntity<ApiResponse<List<AssessmentSummaryDto>>> getAllAssessments() {
        List<AssessmentSummaryDto> list = assessmentService.getAllAssessments();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/courses")
    @Operation(summary = "List all eligible courses with diagnostic assessment status and questions pool size")
    public ResponseEntity<ApiResponse<List<CourseAssessmentEligibilityDto>>> getEligibleCourses() {
        List<CourseAssessmentEligibilityDto> courses = assessmentService.getEligibleCoursesForAssessment();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "Get or provision diagnostic assessment for a specific course")
    public ResponseEntity<ApiResponse<AssessmentSummaryDto>> getAssessmentForCourse(@PathVariable Long courseId) {
        Assessment assessment = assessmentService.getOrCreateAssessmentForCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(assessmentService.getAssessmentById(assessment.getId())));
    }

    @PostMapping("/course/{courseId}/start")
    @Operation(summary = "Start dynamic assessment attempt for a course with randomized questions and option shuffling")
    public ResponseEntity<ApiResponse<AssessmentAttemptStartDto>> startCourseAttempt(@PathVariable Long courseId) {
        AssessmentAttemptStartDto attempt = assessmentService.startCourseAssessmentAttempt(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course assessment attempt started successfully", attempt));
    }

    @GetMapping("/course/{courseId}/history")
    @Operation(summary = "Get current authenticated employee's assessment submission history for a specific course")
    public ResponseEntity<ApiResponse<List<AssessmentHistoryDto>>> getCourseHistory(@PathVariable Long courseId) {
        List<AssessmentHistoryDto> history = assessmentService.getCourseAssessmentHistory(courseId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/skill/{skillId}")
    @Operation(summary = "List diagnostic assessments available for a specific skill")
    public ResponseEntity<ApiResponse<List<AssessmentSummaryDto>>> getAssessmentsForSkill(@PathVariable Long skillId) {
        List<AssessmentSummaryDto> list = assessmentService.getAssessmentsForSkill(skillId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get diagnostic assessment metadata by ID")
    public ResponseEntity<ApiResponse<AssessmentSummaryDto>> getAssessmentById(@PathVariable Long id) {
        AssessmentSummaryDto dto = assessmentService.getAssessmentById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/{id}/questions")
    @Operation(summary = "Fetch assessment questions and options safely (Never exposes answer keys)")
    public ResponseEntity<ApiResponse<List<QuestionDto>>> getQuestionsSafe(@PathVariable Long id) {
        List<QuestionDto> questions = assessmentService.getQuestionsSafe(id);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @PostMapping("/course/{courseId}/generate-questions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Generate diagnostic assessment questions for a course using OpenAI API (falls back to deterministic generator if API is unconfigured)")
    public ResponseEntity<ApiResponse<List<QuestionDto>>> generateQuestionsForCourse(
            @PathVariable Long courseId,
            @RequestParam(defaultValue = "5") int count) {
        List<QuestionDto> questions = assessmentService.generateQuestionsForCourse(courseId, count);
        return ResponseEntity.ok(ApiResponse.success("Assessment questions generated successfully", questions));
    }

    @PostMapping("/{id}/generate-questions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Generate diagnostic assessment questions for an assessment using OpenAI API (falls back to deterministic generator if API is unconfigured)")
    public ResponseEntity<ApiResponse<List<QuestionDto>>> generateQuestionsForAssessment(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int count) {
        List<QuestionDto> questions = assessmentService.generateQuestionsForAssessment(id, count);
        return ResponseEntity.ok(ApiResponse.success("Assessment questions generated successfully", questions));
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start an assessment attempt with timestamp and time limit window")
    public ResponseEntity<ApiResponse<AssessmentAttemptStartDto>> startAttempt(@PathVariable Long id) {
        AssessmentAttemptStartDto attempt = assessmentService.startAssessmentAttempt(id);
        return ResponseEntity.ok(ApiResponse.success("Assessment attempt started successfully", attempt));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit answers for server-side evaluation, pass/fail result, and skill verification update")
    public ResponseEntity<ApiResponse<AssessmentResultDto>> submitAssessment(
            @PathVariable Long id,
            @Valid @RequestBody AssessmentSubmissionRequestDto request) {
        AssessmentResultDto result = assessmentService.submitAssessment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Assessment submitted and evaluated successfully", result));
    }

    @GetMapping("/history/me")
    @Operation(summary = "Get current authenticated employee's assessment submission history")
    public ResponseEntity<ApiResponse<List<AssessmentHistoryDto>>> getOwnHistory() {
        List<AssessmentHistoryDto> history = assessmentService.getOwnAssessmentHistory();
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/history/employee/{employeeProfileId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'MENTOR')")
    @Operation(summary = "Get employee assessment submission history (Authorized manager within department, Admin, or Mentor)")
    public ResponseEntity<ApiResponse<List<AssessmentHistoryDto>>> getEmployeeHistory(@PathVariable Long employeeProfileId) {
        List<AssessmentHistoryDto> history = assessmentService.getEmployeeAssessmentHistory(employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
