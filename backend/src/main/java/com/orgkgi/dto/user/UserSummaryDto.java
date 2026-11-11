package com.orgkgi.dto.user;

import com.orgkgi.entity.Role;
import com.orgkgi.entity.UserStatus;

public class UserSummaryDto {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private Role role;
    private UserStatus status;
    private Long departmentId;
    private String departmentName;
    private String currentJobRoleTitle;
    private String resumeFileName;
    private boolean hasResume;
    private java.time.LocalDate hireDate;
    private String managerFullName;
    private Long employeeProfileId;

    public UserSummaryDto() {}

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

    public String getCurrentJobRoleTitle() { return currentJobRoleTitle; }
    public void setCurrentJobRoleTitle(String currentJobRoleTitle) { this.currentJobRoleTitle = currentJobRoleTitle; }

    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }

    public boolean isHasResume() { return hasResume; }
    public void setHasResume(boolean hasResume) { this.hasResume = hasResume; }

    public java.time.LocalDate getHireDate() { return hireDate; }
    public void setHireDate(java.time.LocalDate hireDate) { this.hireDate = hireDate; }

    public String getManagerFullName() { return managerFullName; }
    public void setManagerFullName(String managerFullName) { this.managerFullName = managerFullName; }

    public Long getEmployeeProfileId() { return employeeProfileId; }
    public void setEmployeeProfileId(Long employeeProfileId) { this.employeeProfileId = employeeProfileId; }
}
