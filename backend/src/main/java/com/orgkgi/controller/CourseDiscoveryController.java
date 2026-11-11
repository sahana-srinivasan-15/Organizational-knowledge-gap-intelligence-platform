package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.discovery.CourseComparisonDto;
import com.orgkgi.dto.discovery.ExternalCourseDto;
import com.orgkgi.dto.discovery.TrendingCourseDto;
import com.orgkgi.service.CourseDiscoveryService;
import com.orgkgi.service.TrendingCourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses/discovery")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "External Course Discovery & Comparison", description = "Multi-platform course discovery across Coursera, edX, Udemy, and YouTube with explainable recommendations")
public class CourseDiscoveryController {

    private final CourseDiscoveryService discoveryService;
    private final TrendingCourseService trendingCourseService;

    public CourseDiscoveryController(
            CourseDiscoveryService discoveryService,
            TrendingCourseService trendingCourseService) {
        this.discoveryService = discoveryService;
        this.trendingCourseService = trendingCourseService;
    }

    @GetMapping("/trending")
    @Operation(summary = "Get live trending industry courses dynamically from Coursera Catalog API correlated with employee skill gaps")
    public ResponseEntity<ApiResponse<List<TrendingCourseDto>>> getTrendingCourses(
            @RequestParam(required = false, defaultValue = "8") Integer limit) {
        List<TrendingCourseDto> trending = trendingCourseService.getTrendingCoursesForCurrentEmployee(limit);
        return ResponseEntity.ok(ApiResponse.success(trending));
    }

    @GetMapping("/search")
    @Operation(summary = "Search external courses by keyword, provider, difficulty, budget, and skill relevance")
    public ResponseEntity<ApiResponse<List<ExternalCourseDto>>> searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean isFree,
            @RequestParam(required = false) Integer maxDurationHours,
            @RequestParam(required = false) Long employeeProfileId) {

        List<ExternalCourseDto> results = discoveryService.searchCourses(
                keyword, provider, difficulty, isFree, maxDurationHours, employeeProfileId
        );
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping("/compare")
    @Operation(summary = "Side-by-side comparison of selected courses across platforms, skills, ratings, and price")
    public ResponseEntity<ApiResponse<CourseComparisonDto>> compareCourses(
            @RequestBody List<Long> courseIds,
            @RequestParam(required = false) Long employeeProfileId) {

        CourseComparisonDto comparison = discoveryService.compareCourses(courseIds, employeeProfileId);
        return ResponseEntity.ok(ApiResponse.success(comparison));
    }

    @GetMapping("/alternatives/{courseId}")
    @Operation(summary = "Get suggested alternative courses covering common skills with suitable ratings and cost")
    public ResponseEntity<ApiResponse<List<ExternalCourseDto>>> getAlternatives(
            @PathVariable Long courseId) {

        List<ExternalCourseDto> alternatives = discoveryService.getAlternativesForCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(alternatives));
    }
}
