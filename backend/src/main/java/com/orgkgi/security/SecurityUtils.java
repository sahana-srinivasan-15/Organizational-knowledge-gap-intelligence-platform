package com.orgkgi.security;

import com.orgkgi.entity.Role;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class SecurityUtils {

    public static UserPrincipal getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return (UserPrincipal) authentication.getPrincipal();
    }

    public static Long getCurrentUserId() {
        return getCurrentUserPrincipal().getId();
    }

    public static Role getCurrentUserRole() {
        return getCurrentUserPrincipal().getRole();
    }

    public static Long getCurrentUserDepartmentId() {
        return getCurrentUserPrincipal().getDepartmentId();
    }

    public static boolean isAdmin() {
        return getCurrentUserRole() == Role.ADMIN;
    }

    public static boolean isManager() {
        return getCurrentUserRole() == Role.MANAGER;
    }

    public static boolean isEmployee() {
        return getCurrentUserRole() == Role.EMPLOYEE;
    }

    public static boolean isMentor() {
        return getCurrentUserRole() == Role.MENTOR;
    }

    /**
     * Checks if current user has permission to read/access the target user's details.
     * - ADMIN: can access any user.
     * - MANAGER: can access self or users within the same department.
     * - MENTOR: can access self or users within the same department / assigned mentees.
     * - EMPLOYEE: can only access self.
     */
    public static void validateUserAccess(Long targetUserId, Long targetDepartmentId) {
        UserPrincipal current = getCurrentUserPrincipal();

        if (current.getRole() == Role.ADMIN) {
            return;
        }

        if (Objects.equals(current.getId(), targetUserId)) {
            return;
        }

        if (current.getRole() == Role.MANAGER) {
            if (current.getDepartmentId() != null && Objects.equals(current.getDepartmentId(), targetDepartmentId)) {
                return;
            }
            throw new AccessDeniedException("Managers can only access employees within their department");
        }

        if (current.getRole() == Role.MENTOR) {
            if (current.getDepartmentId() != null && Objects.equals(current.getDepartmentId(), targetDepartmentId)) {
                return;
            }
            throw new AccessDeniedException("Mentors can only access employees within their department or assigned mentees");
        }

        throw new AccessDeniedException("Employees can only access their own profile and records");
    }
}
