package com.orgkgi.dto.user;

import com.orgkgi.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public class CreateUserRequest {

    private String firstName;
    private String lastName;
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private Role role = Role.EMPLOYEE;
    private Long departmentId;
    private Long currentJobRoleId;
    private Long targetJobRoleId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate hireDate;

    private Boolean mentorOptIn = false;
    private Integer mentorAvailabilityHrsPerWeek = 0;

    public CreateUserRequest() {}

    public String getFirstName() {
        if ((firstName == null || firstName.isBlank()) && fullName != null && !fullName.isBlank()) {
            String[] parts = fullName.trim().split("\\s+", 2);
            return parts[0];
        }
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        if ((lastName == null || lastName.isBlank()) && fullName != null && !fullName.isBlank()) {
            String[] parts = fullName.trim().split("\\s+", 2);
            return parts.length > 1 ? parts[1] : "Employee";
        }
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFullName() {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role != null ? role : Role.EMPLOYEE;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getCurrentJobRoleId() {
        return currentJobRoleId;
    }

    public void setCurrentJobRoleId(Long currentJobRoleId) {
        this.currentJobRoleId = currentJobRoleId;
    }

    public Long getTargetJobRoleId() {
        return targetJobRoleId;
    }

    public void setTargetJobRoleId(Long targetJobRoleId) {
        this.targetJobRoleId = targetJobRoleId;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public Boolean getMentorOptIn() {
        return mentorOptIn;
    }

    public void setMentorOptIn(Boolean mentorOptIn) {
        this.mentorOptIn = mentorOptIn;
    }

    public Integer getMentorAvailabilityHrsPerWeek() {
        return mentorAvailabilityHrsPerWeek;
    }

    public void setMentorAvailabilityHrsPerWeek(Integer mentorAvailabilityHrsPerWeek) {
        this.mentorAvailabilityHrsPerWeek = mentorAvailabilityHrsPerWeek;
    }
}
