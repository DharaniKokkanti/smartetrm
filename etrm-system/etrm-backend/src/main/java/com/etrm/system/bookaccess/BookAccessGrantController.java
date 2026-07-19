package com.etrm.system.bookaccess;

import com.etrm.system.auth.AppUserRepository;
import com.etrm.system.book.BookRepository;
import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.legalentity.LegalEntityRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * REST endpoints for book_access_grant management.
 *
 * Implements only the issuing/approval workflow described in V120's
 * migration header — the row-level resolution rule (which grants let a user
 * see which books) is a query-time concern for book listing endpoints,
 * deliberately not built here.
 *
 *  GET    /api/v1/book-access-grants
 *  GET    /api/v1/users/{userId}/book-access-grants
 *  POST   /api/v1/users/{userId}/book-access-grants        { scopeType, scopeId, accessLevel }
 *  PATCH  /api/v1/book-access-grants/{id}/approve
 *  PATCH  /api/v1/book-access-grants/{id}/reject            { reason }
 *  DELETE /api/v1/users/{userId}/book-access-grants/{grantId}
 */
@RestController
@RequestMapping("/api/v1")
public class BookAccessGrantController {

    private final BookAccessGrantRepository grantRepo;
    private final AppUserRepository userRepo;
    private final LegalEntityRepository legalEntityRepo;
    private final BookRepository bookRepo;

    public BookAccessGrantController(
            BookAccessGrantRepository grantRepo,
            AppUserRepository userRepo,
            LegalEntityRepository legalEntityRepo,
            BookRepository bookRepo) {
        this.grantRepo = grantRepo;
        this.userRepo = userRepo;
        this.legalEntityRepo = legalEntityRepo;
        this.bookRepo = bookRepo;
    }

    @GetMapping("/book-access-grants")
    public List<BookAccessGrant> listAll() {
        return grantRepo.findAll();
    }

    @GetMapping("/users/{userId}/book-access-grants")
    public List<BookAccessGrant> listForUser(@PathVariable Integer userId) {
        return grantRepo.findByUserIdAndIsActiveTrue(userId);
    }

    @PostMapping("/users/{userId}/book-access-grants")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public BookAccessGrant create(@PathVariable Integer userId, @Valid @RequestBody GrantRequest body) {
        userRepo.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new NotFoundException("User " + userId + " not found"));

        String scopeType = body.scopeType();
        Integer scopeId = body.scopeId();
        validateScope(scopeType, scopeId);

        grantRepo.findByUserIdAndScopeTypeAndScopeIdAndIsActiveTrue(userId, scopeType, scopeId).ifPresent(g -> {
            throw new ConflictException("User already has an active grant for this scope.");
        });

        BookAccessGrant grant = new BookAccessGrant();
        grant.setUserId(userId);
        grant.setScopeType(scopeType);
        grant.setScopeId(scopeId);
        grant.setAccessLevel(body.accessLevel() != null ? body.accessLevel() : "READ");
        grant.setStatus("PENDING_APPROVAL");
        // No real current-user context wired up yet in this codebase — RbacController
        // hardcodes "system" for assignedBy the same way (see assignRole()).
        grant.setAssignedBy("system");
        return grantRepo.save(grant);
    }

    @PatchMapping("/book-access-grants/{id}/approve")
    public BookAccessGrant approve(@PathVariable Integer id) {
        BookAccessGrant grant = grantRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Grant " + id + " not found"));
        grant.setStatus("ACTIVE");
        grant.setApprovedBy("system");
        grant.setApprovedAt(LocalDateTime.now());
        return grantRepo.save(grant);
    }

    @PatchMapping("/book-access-grants/{id}/reject")
    public BookAccessGrant reject(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        BookAccessGrant grant = grantRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Grant " + id + " not found"));
        grant.setStatus("REJECTED");
        grant.setRejectionReason(body.get("reason"));
        return grantRepo.save(grant);
    }

    @DeleteMapping("/users/{userId}/book-access-grants/{grantId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Integer userId, @PathVariable Integer grantId) {
        BookAccessGrant grant = grantRepo.findById(Objects.requireNonNull(grantId))
                .orElseThrow(() -> new NotFoundException("Grant " + grantId + " not found"));
        grant.setIsActive(false);
        grant.setStatus("EXPIRED");
        grantRepo.save(grant);
    }

    private void validateScope(String scopeType, Integer scopeId) {
        boolean exists = switch (scopeType) {
            case "LEGAL_ENTITY" -> legalEntityRepo.existsById(scopeId);
            case "BOOK" -> bookRepo.existsById(scopeId);
            default -> throw new ConflictException("Unknown scope type \"" + scopeType + "\".");
        };
        if (!exists) {
            throw new NotFoundException("No " + scopeType + " with id " + scopeId + ".");
        }
    }

    record GrantRequest(@NotBlank String scopeType, @NotNull Integer scopeId, String accessLevel) {}
}
