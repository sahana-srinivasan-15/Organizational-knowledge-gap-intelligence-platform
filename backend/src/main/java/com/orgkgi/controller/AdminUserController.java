package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.common.PagedResponse;
import com.orgkgi.dto.user.UpdateUserRoleRequest;
import com.orgkgi.dto.user.UpdateUserStatusRequest;
import com.orgkgi.dto.user.UserSummaryDto;
import com.orgkgi.entity.Role;
import com.orgkgi.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Admin User Management", description = "Administrative endpoints for user role and account status governance")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Get paginated user accounts with optional role and department filters (Admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<UserSummaryDto>>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,asc") String[] sort) {

        String sortField = sort[0];
        Sort.Direction sortDirection = (sort.length > 1 && sort[1].equalsIgnoreCase("desc"))
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));
        PagedResponse<UserSummaryDto> users = userService.getUsersPaged(role, departmentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping(consumes = { org.springframework.http.MediaType.APPLICATION_JSON_VALUE, org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE })
    @Operation(summary = "Provision a new user account (Admin only)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> createUser(
            @Valid @RequestBody(required = false) com.orgkgi.dto.user.CreateUserRequest jsonRequest,
            @ModelAttribute(binding = false) com.orgkgi.dto.user.CreateUserRequest formRequest,
            @RequestParam(value = "resume", required = false) org.springframework.web.multipart.MultipartFile resume) {
        com.orgkgi.dto.user.CreateUserRequest request = jsonRequest != null ? jsonRequest : formRequest;
        UserSummaryDto created = userService.createUser(request, resume);
        return ResponseEntity.ok(ApiResponse.success("User account created successfully", created));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update user account status (Admin only)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        UserSummaryDto updated = userService.updateUserStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", updated));
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Update user authorization role (Admin only)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        UserSummaryDto updated = userService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently delete user account and all associated profile records (Admin only)")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User account successfully deleted", "USER_DELETED"));
    }
}
