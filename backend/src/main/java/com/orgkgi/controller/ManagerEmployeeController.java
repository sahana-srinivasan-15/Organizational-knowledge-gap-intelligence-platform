package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.common.PagedResponse;
import com.orgkgi.dto.user.CreateUserRequest;
import com.orgkgi.dto.user.UserSummaryDto;
import com.orgkgi.entity.Role;
import com.orgkgi.security.SecurityUtils;
import com.orgkgi.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/manager/employees")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Manager Employee Provisioning", description = "Endpoints for managers to provision employee accounts and archive candidate resumes")
public class ManagerEmployeeController {

    private final UserService userService;

    public ManagerEmployeeController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE })
    @Operation(summary = "Provision a new employee or organizational account with resume attachment (Manager/Admin)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> provisionEmployee(
            @Valid @ModelAttribute CreateUserRequest request,
            @RequestParam(value = "resume", required = false) MultipartFile resume) {

        // If manager didn't specify department, auto-bind to manager's department
        if (request.getDepartmentId() == null && SecurityUtils.isManager()) {
            request.setDepartmentId(SecurityUtils.getCurrentUserDepartmentId());
        }

        UserSummaryDto createdUser = userService.createUser(request, resume);
        return ResponseEntity.ok(ApiResponse.success("Account provisioned successfully with talent profile", createdUser));
    }

    @GetMapping
    @Operation(summary = "Get paginated employee list for manager's department or company")
    public ResponseEntity<ApiResponse<PagedResponse<UserSummaryDto>>> getEmployees(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        String sortField = sort[0];
        Sort.Direction sortDirection = (sort.length > 1 && sort[1].equalsIgnoreCase("desc"))
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Long effectiveDeptId = departmentId;
        // If caller is MANAGER and no explicit dept filter is passed, filter by manager's department
        if (effectiveDeptId == null && SecurityUtils.isManager()) {
            effectiveDeptId = SecurityUtils.getCurrentUserDepartmentId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));
        PagedResponse<UserSummaryDto> users = userService.getUsersPaged(role, effectiveDeptId, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
