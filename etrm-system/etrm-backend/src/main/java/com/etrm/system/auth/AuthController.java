package com.etrm.system.auth;

import com.etrm.system.common.JwtService;
import com.etrm.system.rbac.UserPermissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Real login flow against dbo.app_user — bcrypt verification, a simple
 * lockout after repeated failures, JWT issuance. Real per-request
 * authorization (function/role grants) is loaded fresh on every request by
 * JwtAuthenticationFilter/UserPermissionService, not baked into the token —
 * this endpoint only additionally reports {@code isSystemAdmin} in the
 * response body so the frontend can decide whether to show admin-only
 * affordances (e.g. the ADMIN-role override on V157-locked Static Data
 * tables) without a second round-trip.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_MINUTES = 15;

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserPermissionService permissionService;

    public AuthController(
            AppUserRepository userRepository, PasswordEncoder passwordEncoder,
            JwtService jwtService, UserPermissionService permissionService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.permissionService = permissionService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        var userOpt = userRepository.findByUsernameIgnoreCase(request.username());

        if (userOpt.isEmpty()) {
            return unauthorized("Invalid username or password.");
        }

        AppUser user = userOpt.get();

        if (!user.getIsActive()) {
            return unauthorized("This account is deactivated.");
        }
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            return unauthorized("This account is temporarily locked due to repeated failed login attempts.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            short attempts = (short) (user.getFailedLoginCount() + 1);
            user.setFailedLoginCount(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(LocalDateTime.now().plusSeconds(LOCKOUT_MINUTES * 60));
            }
            userRepository.save(user);
            return unauthorized("Invalid username or password.");
        }

        user.setFailedLoginCount((short) 0);
        user.setLockedUntil(null);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        Long userId = user.getUserId().longValue();
        String token = jwtService.generateToken(user.getUsername(), userId);
        boolean isSystemAdmin = permissionService.isSystemAdmin(userId);
        return ResponseEntity.ok(new LoginResponse(token, userId, user.getUsername(), user.getFullName(), isSystemAdmin));
    }

    private ResponseEntity<ProblemDetail> unauthorized(String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detail);
        pd.setTitle("Unauthorized");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
    }
}
