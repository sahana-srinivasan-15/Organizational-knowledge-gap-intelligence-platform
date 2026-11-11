package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.notification.NotificationDto;
import com.orgkgi.security.SecurityUtils;
import com.orgkgi.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Notifications", description = "In-app notifications for suggestions, course milestones, and peer mentorship")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get current authenticated user's notifications")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<NotificationDto> notifications = notificationService.getUserNotifications(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications for current user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        long count = notificationService.getUnreadCount(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", Map.of("count", count)));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        NotificationDto dto = notificationService.markAsRead(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", dto));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Map<String, String>>> markAllAsRead() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        notificationService.markAllAsRead(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", Map.of("status", "SUCCESS")));
    }
}

