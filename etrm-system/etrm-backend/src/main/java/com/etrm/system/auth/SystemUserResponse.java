package com.etrm.system.auth;

import com.etrm.system.rbac.UserRoleAssignment;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Denormalized view of an app_user row plus every ACTIVE / PENDING_APPROVAL
 * role assignment they currently hold. app_user has no role column anymore
 * (see V79) — a user's real role(s) live entirely in user_role_assignment,
 * and a user can hold more than one at once (its uniqueness constraint is on
 * (user_id, role_id), not user_id alone).
 */
public record SystemUserResponse(
        Integer userId,
        String username,
        String email,
        String fullName,
        Integer legalEntityId,
        List<RoleSummary> roles,
        String department,
        String phone,
        Long traderId,
        String preferredLocale,
        String officeLocation,
        Boolean isActive,
        LocalDateTime lastLogin,
        LocalDateTime createdAt
) {
    public record RoleSummary(Integer assignmentId, Integer roleId, String roleCode, String roleName, String status) {}

    public static SystemUserResponse of(AppUser u, List<UserRoleAssignment> assignments) {
        List<RoleSummary> roles = assignments.stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()) || "PENDING_APPROVAL".equals(a.getStatus()))
                .map(a -> new RoleSummary(
                        a.getAssignmentId(), a.getRole().getRoleId(), a.getRole().getRoleCode(),
                        a.getRole().getRoleName(), a.getStatus()))
                .toList();
        return new SystemUserResponse(
                u.getUserId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getLegalEntityId(),
                roles, u.getDepartment(), u.getPhone(), u.getTraderId(), u.getPreferredLocale(),
                u.getOfficeLocation(), u.getIsActive(), u.getLastLogin(), u.getCreatedAt());
    }
}
