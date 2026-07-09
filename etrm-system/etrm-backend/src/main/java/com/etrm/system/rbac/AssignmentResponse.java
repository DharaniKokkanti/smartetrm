package com.etrm.system.rbac;

import com.etrm.system.auth.AppUser;

import java.time.Instant;
import java.time.LocalDate;

/**
 * UserRoleAssignment only stores userId — denormalizes the user's
 * username/fullName for display, the same gap the frontend's Roles &
 * Permissions "User Assignments" tab had (a bare numeric User ID column with
 * no name at all) until it was fixed to match this shape.
 */
public record AssignmentResponse(
        Long assignmentId,
        Long userId,
        String username,
        String fullName,
        Long roleId,
        String roleCode,
        String roleName,
        String status,
        String assignedBy,
        Instant assignedAt,
        String approvedBy,
        Instant approvedAt,
        String rejectionReason,
        LocalDate validFrom,
        LocalDate validTo,
        Boolean isActive
) {
    public static AssignmentResponse of(UserRoleAssignment a, AppUser user) {
        return new AssignmentResponse(
                a.getAssignmentId(), a.getUserId(),
                user != null ? user.getUsername() : null, user != null ? user.getFullName() : null,
                a.getRole().getRoleId(), a.getRole().getRoleCode(), a.getRole().getRoleName(),
                a.getStatus(), a.getAssignedBy(), a.getAssignedAt(), a.getApprovedBy(), a.getApprovedAt(),
                a.getRejectionReason(), a.getValidFrom(), a.getValidTo(), a.getIsActive());
    }
}
