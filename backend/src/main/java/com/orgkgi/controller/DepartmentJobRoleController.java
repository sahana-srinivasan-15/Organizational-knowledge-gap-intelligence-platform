package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.common.DepartmentDto;
import com.orgkgi.dto.common.JobRoleDto;
import com.orgkgi.entity.Department;
import com.orgkgi.entity.JobRole;
import com.orgkgi.repository.DepartmentRepository;
import com.orgkgi.repository.JobRoleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("isAuthenticated()")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Departments & Job Roles", description = "Endpoints for retrieving organizational departments and job role catalogs")
public class DepartmentJobRoleController {

    private final DepartmentRepository departmentRepository;
    private final JobRoleRepository jobRoleRepository;

    public DepartmentJobRoleController(DepartmentRepository departmentRepository, JobRoleRepository jobRoleRepository) {
        this.departmentRepository = departmentRepository;
        this.jobRoleRepository = jobRoleRepository;
    }

    @GetMapping("/departments")
    @Transactional(readOnly = true)
    @Operation(summary = "Get list of all organizational departments")
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> getAllDepartments() {
        List<DepartmentDto> departments = departmentRepository.findAll().stream()
                .map(this::mapToDepartmentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(departments));
    }

    @GetMapping("/job-roles")
    @Transactional(readOnly = true)
    @Operation(summary = "Get job roles, optionally filtered by department ID")
    public ResponseEntity<ApiResponse<List<JobRoleDto>>> getJobRoles(@RequestParam(required = false) Long departmentId) {
        List<JobRole> roles = jobRoleRepository.findAllWithDepartment(departmentId);

        List<JobRoleDto> dtos = roles.stream()
                .map(this::mapToJobRoleDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    private DepartmentDto mapToDepartmentDto(Department dept) {
        return new DepartmentDto(
                dept.getId(),
                dept.getName(),
                dept.getCode(),
                dept.getDescription()
        );
    }

    private JobRoleDto mapToJobRoleDto(JobRole role) {
        return new JobRoleDto(
                role.getId(),
                role.getTitle(),
                role.getCode(),
                role.getDepartment() != null ? role.getDepartment().getId() : null,
                role.getDepartment() != null ? role.getDepartment().getName() : null,
                role.getLevel(),
                role.getDescription()
        );
    }
}
