package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.common.ResumeDownloadInfo;
import com.orgkgi.dto.employee.EmployeeProfileDto;
import com.orgkgi.dto.employee.UpdateEmployeeProfileRequest;
import com.orgkgi.dto.mentorship.CourseMentorQualificationDto;
import com.orgkgi.dto.mentorship.MentorEligibilityDto;
import com.orgkgi.dto.mentorship.MentorStatusUpdateRequest;
import com.orgkgi.service.EmployeeProfileService;
import com.orgkgi.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Employees", description = "Endpoints for employee talent profiles and mentorship preferences")
public class EmployeeController {

    private final EmployeeProfileService employeeProfileService;
    private final UserService userService;

    public EmployeeController(EmployeeProfileService employeeProfileService, UserService userService) {
        this.employeeProfileService = employeeProfileService;
        this.userService = userService;
    }

    @GetMapping("/me/profile")
    @Operation(summary = "Get current employee's talent profile, verified skills, and mentorship preferences")
    public ResponseEntity<ApiResponse<EmployeeProfileDto>> getCurrentEmployeeProfile() {
        EmployeeProfileDto profile = employeeProfileService.getCurrentEmployeeProfile();
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Update current employee's self-service profile fields (mentor opt-in, availability, target role)")
    public ResponseEntity<ApiResponse<EmployeeProfileDto>> updateCurrentEmployeeProfile(
            @Valid @RequestBody UpdateEmployeeProfileRequest request) {
        EmployeeProfileDto updated = employeeProfileService.updateCurrentEmployeeProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Profile preferences updated successfully", updated));
    }

    @GetMapping("/me/mentor-eligibility")
    @Operation(summary = "Check current employee's eligibility to become a peer mentor (requires course certificate + passed assessment)")
    public ResponseEntity<ApiResponse<MentorEligibilityDto>> getMentorEligibility() {
        MentorEligibilityDto eligibility = employeeProfileService.getCurrentUserMentorEligibility();
        return ResponseEntity.ok(ApiResponse.success(eligibility));
    }

    @GetMapping("/me/mentor-courses")
    @Operation(summary = "Get course-by-course mentor qualifications and statuses for authenticated user")
    public ResponseEntity<ApiResponse<List<CourseMentorQualificationDto>>> getMyMentorCourses() {
        List<CourseMentorQualificationDto> list = employeeProfileService.getCurrentUserMentorCourses();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/profiles/{profileId}/mentor-courses")
    @Operation(summary = "Get course-by-course mentor qualifications for a specific employee profile")
    public ResponseEntity<ApiResponse<List<CourseMentorQualificationDto>>> getProfileMentorCourses(
            @PathVariable Long profileId) {
        List<CourseMentorQualificationDto> list = employeeProfileService.getProfileMentorCourses(profileId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/me/mentor-status")
    @Operation(summary = "Update employee peer mentor preferences with eligibility enforcement")
    public ResponseEntity<ApiResponse<EmployeeProfileDto>> updateMentorStatus(
            @RequestBody MentorStatusUpdateRequest request) {
        EmployeeProfileDto updated = employeeProfileService.updateMentorStatus(request);
        return ResponseEntity.ok(ApiResponse.success("Peer mentorship settings updated successfully", updated));
    }

    @GetMapping("/{userId}/profile")
    @Operation(summary = "Get employee profile by User ID (Authorized managers or administrators only)")
    public ResponseEntity<ApiResponse<EmployeeProfileDto>> getEmployeeProfileByUserId(@PathVariable Long userId) {
        EmployeeProfileDto profile = employeeProfileService.getEmployeeProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/{userId}/resume")
    @Operation(summary = "Download or view employee resume PDF file")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long userId) {
        ResumeDownloadInfo resumeInfo = userService.getResumeResource(userId);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(resumeInfo.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resumeInfo.getFilename() + "\"")
            .body(resumeInfo.getResource());
    }
}
