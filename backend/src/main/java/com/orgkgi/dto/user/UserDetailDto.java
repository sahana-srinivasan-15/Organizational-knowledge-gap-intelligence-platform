package com.orgkgi.dto.user;

import com.orgkgi.dto.employee.EmployeeProfileDto;
import com.orgkgi.entity.Role;
import com.orgkgi.entity.UserStatus;

import java.time.OffsetDateTime;

public class UserDetailDto {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private Role role;
    private UserStatus status;
    private Long departmentId;
    private String departmentName;
    private EmployeeProfileDto employeeProfile;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public UserDetailDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public EmployeeProfileDto getEmployeeProfile() { return employeeProfile; }
    public void setEmployeeProfile(EmployeeProfileDto employeeProfile) { this.employeeProfile = employeeProfile; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
