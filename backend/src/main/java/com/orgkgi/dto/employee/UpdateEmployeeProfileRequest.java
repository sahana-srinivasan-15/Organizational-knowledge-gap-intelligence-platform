package com.orgkgi.dto.employee;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateEmployeeProfileRequest {

    @NotNull(message = "mentorOptIn cannot be null")
    private Boolean mentorOptIn;

    @NotNull(message = "mentorAvailabilityHrsPerWeek cannot be null")
    @Min(value = 0, message = "Availability hours cannot be negative")
    @Max(value = 40, message = "Availability hours cannot exceed 40 hours per week")
    private Integer mentorAvailabilityHrsPerWeek;

    private Long targetJobRoleId;

    public UpdateEmployeeProfileRequest() {}

    public UpdateEmployeeProfileRequest(Boolean mentorOptIn, Integer mentorAvailabilityHrsPerWeek, Long targetJobRoleId) {
        this.mentorOptIn = mentorOptIn;
        this.mentorAvailabilityHrsPerWeek = mentorAvailabilityHrsPerWeek;
        this.targetJobRoleId = targetJobRoleId;
    }

    public Boolean getMentorOptIn() { return mentorOptIn; }
    public void setMentorOptIn(Boolean mentorOptIn) { this.mentorOptIn = mentorOptIn; }

    public Integer getMentorAvailabilityHrsPerWeek() { return mentorAvailabilityHrsPerWeek; }
    public void setMentorAvailabilityHrsPerWeek(Integer mentorAvailabilityHrsPerWeek) { this.mentorAvailabilityHrsPerWeek = mentorAvailabilityHrsPerWeek; }

    public Long getTargetJobRoleId() { return targetJobRoleId; }
    public void setTargetJobRoleId(Long targetJobRoleId) { this.targetJobRoleId = targetJobRoleId; }
}
