package com.etrm.system.auth;

import com.etrm.system.common.JwtService;
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
 * Minimal but real login flow against dbo.app_user — bcrypt verification,
 * a simple lockout after repeated failures, JWT issuance. This is
 * intentionally NOT a full permission system: every successful login gets
 * the same single ROLE_USER authority (see JwtAuthenticationFilter). Real
 * role-based access waits on the separate role table described in the
 * Master Data Entry Technical Design doc, Section 6.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_MINUTES = 15;

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(AppUserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

        String token = jwtService.generateToken(user.getUsername(), user.getUserId().longValue());
        return ResponseEntity.ok(new LoginResponse(token, user.getUserId().longValue(), user.getUsername(), user.getFullName()));
    }

    private ResponseEntity<ProblemDetail> unauthorized(String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detail);
        pd.setTitle("Unauthorized");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
    }
}
