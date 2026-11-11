package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.user.UserDetailDto;
import com.orgkgi.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Users", description = "Endpoints for user profile and identity management")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user's profile and roles")
    public ResponseEntity<ApiResponse<UserDetailDto>> getCurrentUser() {
        UserDetailDto userDetail = userService.getCurrentUserDetail();
        return ResponseEntity.ok(ApiResponse.success(userDetail));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID with department and ownership boundary validation")
    public ResponseEntity<ApiResponse<UserDetailDto>> getUserById(@PathVariable Long id) {
        UserDetailDto userDetail = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(userDetail));
    }
}
