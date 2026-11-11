package com.orgkgi.dto.user;

import com.orgkgi.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateUserStatusRequest {

    @NotNull(message = "Status is required")
    private UserStatus status;

    public UpdateUserStatusRequest() {}

    public UpdateUserStatusRequest(UserStatus status) {
        this.status = status;
    }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
}
