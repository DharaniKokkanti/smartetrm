package com.etrm.system.legalentity;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.polymorphic.BankAccount;
import com.etrm.system.polymorphic.BankAccountRepository;
import com.etrm.system.polymorphic.EntityType;
import com.etrm.system.settlement.SettlementInstruction;
import com.etrm.system.settlement.SettlementInstructionService;
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
    private final BankAccountRepository bankAccountRepository;
    private final SettlementInstructionService settlementInstructionService;

    public LegalEntityController(
            LegalEntityService service,
            LegalEntityOwnershipService ownershipService,
            BankAccountRepository bankAccountRepository,
            SettlementInstructionService settlementInstructionService
    ) {
        this.service = service;
        this.ownershipService = ownershipService;
        this.bankAccountRepository = bankAccountRepository;
        this.settlementInstructionService = settlementInstructionService;
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

    // ── Bank accounts (bank_account.entity_id is INT) — previously entirely
    // missing here despite bank_account fully supporting entity_type=
    // 'LEGAL_ENTITY'; see docs/masterdata_pending_project_01.md 2026-07-21
    // finding. Mirrors CounterpartyController's bank-accounts sub-resource
    // exactly (server-controlled entityType/entityId, never client-trusted).

    @GetMapping("/{id}/bank-accounts")
    public List<BankAccount> listBankAccounts(@PathVariable Integer id) {
        return bankAccountRepository.findByEntityTypeAndEntityId(EntityType.LEGAL_ENTITY, id);
    }

    @PostMapping("/{id}/bank-accounts")
    public ResponseEntity<BankAccount> addBankAccount(@PathVariable Integer id, @Valid @RequestBody BankAccount input) {
        service.get(id);
        input.setBankAccountId(null);
        input.setEntityType(EntityType.LEGAL_ENTITY);
        input.setEntityId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(bankAccountRepository.save(input));
    }

    @PutMapping("/{id}/bank-accounts/{bankAccountId}")
    public BankAccount updateBankAccount(
            @PathVariable Integer id, @PathVariable Integer bankAccountId, @Valid @RequestBody BankAccount input
    ) {
        bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new NotFoundException("No bank account with id " + bankAccountId + "."));
        input.setBankAccountId(bankAccountId);
        input.setEntityType(EntityType.LEGAL_ENTITY);
        input.setEntityId(id);
        return bankAccountRepository.save(input);
    }

    // ── Settlement instructions (RECEIVE-direction SSIs point at one of the
    // accounts above — this is the read side, creation happens under the
    // counterparty that owns the routing relationship) ─────────────────────

    @GetMapping("/{id}/settlement-instructions")
    public List<SettlementInstruction> listSettlementInstructions(@PathVariable Integer id) {
        return settlementInstructionService.listForOurEntity(id);
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
