package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.course.CourseDto;
import com.orgkgi.dto.course.CourseRecommendationDto;
import com.orgkgi.dto.course.RecommendCourseRequest;
import com.orgkgi.service.CourseRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Courses & Recommendations", description = "Course catalog and dynamic skill-gap-driven recommendations")
public class CourseController {

    private final CourseRecommendationService courseRecommendationService;

    public CourseController(CourseRecommendationService courseRecommendationService) {
        this.courseRecommendationService = courseRecommendationService;
    }

    @GetMapping
    @Operation(summary = "List all available courses in the catalog with skills covered")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getAllCourses() {
        List<CourseDto> courses = courseRecommendationService.getAllCourses();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/recommendations/me")
    @Operation(summary = "Get dynamic course recommendations for authenticated employee based on target role skill gaps")
    public ResponseEntity<ApiResponse<List<CourseRecommendationDto>>> getOwnRecommendations() {
        List<CourseRecommendationDto> recommendations = courseRecommendationService.getRecommendationsForCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }

    @GetMapping("/recommendations/employee/{employeeProfileId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'MENTOR')")
    @Operation(summary = "Get dynamic course recommendations for a specific employee (Manager within department, Admin, or Mentor)")
    public ResponseEntity<ApiResponse<List<CourseRecommendationDto>>> getEmployeeRecommendations(@PathVariable Long employeeProfileId) {
        List<CourseRecommendationDto> recommendations = courseRecommendationService.getRecommendationsForEmployee(employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }

    @PostMapping("/recommend")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'MENTOR')")
    @Operation(summary = "Recommend a course to an employee (Mentor, Manager, or Admin)")
    public ResponseEntity<ApiResponse<CourseRecommendationDto>> recommendCourse(
            @Valid @RequestBody RecommendCourseRequest request) {
        CourseRecommendationDto result = courseRecommendationService.recommendCourse(request);
        return ResponseEntity.ok(ApiResponse.success("Course recommended successfully to employee", result));
    }
}
