package com.etrm.system.legalentity;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/tier1/legal-entity/api.ts — this is the
 * contract the frontend was built against.
 *
 * Also owns the legal_entity_ownership (V125) sub-resource — a JV entity's
 * cap table:
 *  GET    /api/v1/legal-entities/{jvEntityId}/ownership
 *  POST   /api/v1/legal-entities/{jvEntityId}/ownership
 *  DELETE /api/v1/legal-entities/{jvEntityId}/ownership/{ownershipId}
 */
@RestController
@RequestMapping("/api/v1/legal-entities")
public class LegalEntityController {

    private final LegalEntityService service;
    private final LegalEntityOwnershipService ownershipService;

    public LegalEntityController(LegalEntityService service, LegalEntityOwnershipService ownershipService) {
        this.service = service;
        this.ownershipService = ownershipService;
    }

    @GetMapping
    public List<LegalEntity> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public LegalEntity get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<LegalEntity> create(@Valid @RequestBody LegalEntity input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public LegalEntity update(@PathVariable Integer id, @Valid @RequestBody LegalEntity input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk")
    public LegalEntityService.BulkResult bulkCreate(@RequestBody BulkCreateRequest request) {
        return service.bulkCreate(request.entities());
    }

    // ── legal_entity_ownership sub-resource ──────────────────────────────────

    @GetMapping("/{jvEntityId}/ownership")
    public LegalEntityOwnershipListView listOwnership(@PathVariable Integer jvEntityId) {
        return ownershipService.list(jvEntityId);
    }

    @PostMapping("/{jvEntityId}/ownership")
    public ResponseEntity<LegalEntityOwnership> addOwnership(@PathVariable Integer jvEntityId,
                                                               @Valid @RequestBody AddOwnershipRequest body) {
        LegalEntityOwnership input = new LegalEntityOwnership();
        input.setOwnerType(body.ownerType());
        input.setOwnerRefId(body.ownerRefId());
        input.setExternalOwnerName(body.externalOwnerName());
        input.setOwnershipPct(body.ownershipPct());
        input.setIsOperator(body.isOperator() != null && body.isOperator());
        input.setConsolidationMethod(body.consolidationMethod());
        input.setEffectiveFrom(body.effectiveFrom());
        input.setNotes(body.notes());
        return ResponseEntity.status(HttpStatus.CREATED).body(ownershipService.add(jvEntityId, input));
    }

    @DeleteMapping("/{jvEntityId}/ownership/{ownershipId}")
    public ResponseEntity<Void> removeOwnership(@PathVariable Integer jvEntityId,
                                                 @PathVariable Integer ownershipId) {
        ownershipService.remove(jvEntityId, ownershipId);
        return ResponseEntity.noContent().build();
    }

    // Deliberately separate from the LegalEntityOwnership entity itself
    // (jvEntityId is a path variable, not a request-body field) — binding
    // @Valid straight to the entity would validate its @NotNull jvEntityId
    // against the not-yet-populated field before the controller ever gets a
    // chance to set it from the path. Same reasoning as BookController's own
    // AddClassificationRequest record.
    record AddOwnershipRequest(
            @NotBlank String ownerType,
            Integer ownerRefId,
            String externalOwnerName,
            @NotNull @DecimalMin("0.001") @DecimalMax("100") BigDecimal ownershipPct,
            Boolean isOperator,
            @NotBlank String consolidationMethod,
            @NotNull LocalDate effectiveFrom,
            String notes) {
    }
}
