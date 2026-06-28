package com.etrm.system.auth;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

/**
 * Admin CRUD for system users.
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

    private final AppUserRepository userRepo;
    private final PasswordEncoder   passwordEncoder;

    public SystemUserController(AppUserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo        = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<AppUser> listUsers() {
        return userRepo.findAll();
    }

    @GetMapping("/{id}")
    public AppUser getUser(@PathVariable Long id) {
        return userRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("User " + id + " not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppUser createUser(@RequestBody UserRequest body) {
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
        return userRepo.save(user);
    }

    @PutMapping("/{id}")
    public AppUser updateUser(@PathVariable Long id, @RequestBody UserRequest body) {
        AppUser user = userRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("User " + id + " not found"));
        applyFields(user, body);
        if (body.password() != null && !body.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(body.password()));
        }
        return userRepo.save(Objects.requireNonNull(user));
    }

    @PatchMapping("/{id}/deactivate")
    public AppUser deactivateUser(@PathVariable Long id) {
        AppUser user = userRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("User " + id + " not found"));
        user.setIsActive(false);
        return userRepo.save(user);
    }

    @PatchMapping("/{id}/activate")
    public AppUser activateUser(@PathVariable Long id) {
        AppUser user = userRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("User " + id + " not found"));
        user.setIsActive(true);
        return userRepo.save(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void applyFields(AppUser user, UserRequest body) {
        user.setUsername(body.username());
        user.setEmail(body.email());
        user.setFullName(body.fullName());
        user.setLegalEntityId(body.legalEntityId());
        user.setRole(body.role());
        user.setDepartment(body.department());
        user.setPhone(body.phone());
        user.setTraderId(body.traderId());
        user.setPreferredLocale(body.preferredLocale());
        user.setOfficeLocation(body.officeLocation());
        if (body.isActive() != null) user.setIsActive(body.isActive());
    }

    record UserRequest(
            String username,
            String email,
            String fullName,
            String password,
            Long   legalEntityId,
            String role,
            String department,
            String phone,
            Long   traderId,
            String preferredLocale,
            String officeLocation,
            Boolean isActive
    ) {}
}
