package com.etrm.system.auth;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.rbac.UserRole;
import com.etrm.system.rbac.UserRoleAssignment;
import com.etrm.system.rbac.UserRoleAssignmentRepository;
import com.etrm.system.rbac.UserRoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

/**
 * Admin CRUD for system users. A user's role(s) are not stored on app_user
 * (see V79 — the old flat `role` column bypassed the real RBAC system
 * entirely) — they're denormalized live from user_role_assignment, same as
 * RbacController's own assignment endpoints. Creating a user requests its
 * first role through the identical pending-approval path as any other
 * assignment; changing an existing user's roles goes through
 * RbacController's assignment endpoints, not this one.
 *
 *  GET    /api/v1/admin/users
 *  GET    /api/v1/admin/users/{id}
 *  POST   /api/v1/admin/users
 *  PUT    /api/v1/admin/users/{id}
 *  PATCH  /api/v1/admin/users/{id}/deactivate
 *  PATCH  /api/v1/admin/users/{id}/activate
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class SystemUserController {

    private final AppUserRepository            userRepo;
    private final UserRoleRepository           roleRepo;
    private final UserRoleAssignmentRepository assignmentRepo;
    private final PasswordEncoder              passwordEncoder;

    public SystemUserController(
            AppUserRepository userRepo,
            UserRoleRepository roleRepo,
            UserRoleAssignmentRepository assignmentRepo,
            PasswordEncoder passwordEncoder) {
        this.userRepo        = userRepo;
        this.roleRepo        = roleRepo;
        this.assignmentRepo  = assignmentRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<SystemUserResponse> listUsers() {
        return userRepo.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public SystemUserResponse getUser(@PathVariable Integer id) {
        return toResponse(findUser(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SystemUserResponse createUser(@RequestBody UserRequest body) {
        userRepo.findByUsernameIgnoreCase(body.username()).ifPresent(u -> {
            throw new ConflictException("Username '" + body.username() + "' already exists.");
        });
        AppUser user = new AppUser();
        applyFields(user, body);
        if (body.password() != null && !body.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(body.password()));
        } else {
            throw new IllegalArgumentException("Password is required when creating a user.");
        }
        AppUser saved = userRepo.save(user);

        if (body.roleId() != null) {
            UserRole role = roleRepo.findById(Objects.requireNonNull(body.roleId()))
                    .orElseThrow(() -> new NotFoundException("Role " + body.roleId() + " not found"));
            if (!"APPROVED".equals(role.getStatus())) {
                throw new ConflictException("Only APPROVED roles can be assigned.");
            }
            UserRoleAssignment a = new UserRoleAssignment();
            a.setUserId(saved.getUserId());
            a.setRole(role);
            a.setAssignedBy("system");
            a.setStatus("PENDING_APPROVAL");
            assignmentRepo.save(a);
        }

        return toResponse(saved);
    }

    @PutMapping("/{id}")
    public SystemUserResponse updateUser(@PathVariable Integer id, @RequestBody UserRequest body) {
        AppUser user = findUser(id);
        applyFields(user, body);
        if (body.password() != null && !body.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(body.password()));
        }
        return toResponse(userRepo.save(Objects.requireNonNull(user)));
    }

    @PatchMapping("/{id}/deactivate")
    public SystemUserResponse deactivateUser(@PathVariable Integer id) {
        AppUser user = findUser(id);
        user.setIsActive(false);
        return toResponse(userRepo.save(user));
    }

    @PatchMapping("/{id}/activate")
    public SystemUserResponse activateUser(@PathVariable Integer id) {
        AppUser user = findUser(id);
        user.setIsActive(true);
        return toResponse(userRepo.save(user));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AppUser findUser(Integer id) {
        return userRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("User " + id + " not found"));
    }

    private SystemUserResponse toResponse(AppUser user) {
        return SystemUserResponse.of(user, assignmentRepo.findByUserIdAndIsActiveTrue(user.getUserId()));
    }

    private void applyFields(AppUser user, UserRequest body) {
        user.setUsername(body.username());
        user.setEmail(body.email());
        user.setFullName(body.fullName());
        user.setLegalEntityId(body.legalEntityId());
        user.setDepartment(body.department());
        user.setPhone(body.phone());
        user.setTraderId(body.traderId());
        user.setPreferredLocale(body.preferredLocale());
        user.setOfficeLocation(body.officeLocation());
        if (body.isActive() != null) user.setIsActive(body.isActive());
    }

    /** roleId is create-only — it requests the user's first role assignment,
     *  same pending-approval path as any other assignment. Ignored on update;
     *  additional roles are granted via RbacController's assignment endpoints. */
    record UserRequest(
            String username,
            String email,
            String fullName,
            String password,
            Integer legalEntityId,
            Integer roleId,
            String department,
            String phone,
            Long   traderId,
            String preferredLocale,
            String officeLocation,
            Boolean isActive
    ) {}
}
