package com.etrm.system.settlement;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyService;
import com.etrm.system.legalentity.LegalEntityService;
import com.etrm.system.polymorphic.BankAccount;
import com.etrm.system.polymorphic.BankAccountRepository;
import com.etrm.system.polymorphic.EntityType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * SSIs are immutable once created — see the header comment on V159's
 * migration for why (audit trail of who requested a bank-detail change and
 * who independently verified it, the standard maker-checker fraud control
 * for settlement-instruction changes per ISDA/FMSB guidance). This service
 * only ever creates new rows or moves an existing row through
 * PENDING_VERIFICATION -> ACTIVE/REJECTED -> SUPERSEDED; there is no update().
 */
@Service
public class SettlementInstructionService {

    private final SettlementInstructionRepository repository;
    private final BankAccountRepository bankAccountRepository;
    private final CounterpartyService counterpartyService;
    private final LegalEntityService legalEntityService;

    public SettlementInstructionService(
            SettlementInstructionRepository repository,
            BankAccountRepository bankAccountRepository,
            CounterpartyService counterpartyService,
            LegalEntityService legalEntityService
    ) {
        this.repository = repository;
        this.bankAccountRepository = bankAccountRepository;
        this.counterpartyService = counterpartyService;
        this.legalEntityService = legalEntityService;
    }

    public List<SettlementInstruction> listForCounterparty(Integer counterpartyId) {
        counterpartyService.get(counterpartyId); // 404s if the parent doesn't exist
        return repository.findByCounterpartyId(counterpartyId);
    }

    public List<SettlementInstruction> listAll() {
        return repository.findAll();
    }

    public List<SettlementInstruction> listForOurEntity(Integer ourEntityId) {
        legalEntityService.get(ourEntityId); // 404s if the parent doesn't exist
        return repository.findByOurEntityId(ourEntityId);
    }

    public SettlementInstruction get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No settlement instruction with id " + id + "."));
    }

    @Transactional
    public SettlementInstruction create(Integer counterpartyId, SettlementInstruction input) {
        counterpartyService.get(counterpartyId);
        legalEntityService.get(input.getOurEntityId());

        BankAccount account = bankAccountRepository.findById(input.getBankAccountId())
                .orElseThrow(() -> new NotFoundException("No bank account with id " + input.getBankAccountId() + "."));
        validateAccountOwnership(input.getDirection(), account, counterpartyId, input.getOurEntityId());

        input.setSettlementInstructionId(null);
        input.setCounterpartyId(counterpartyId);
        input.setStatus(SettlementInstruction.Status.PENDING_VERIFICATION);
        input.setVerifiedBy(null);
        input.setVerifiedAt(null);
        input.setSupersededById(null);
        if (input.getValidFrom() == null) {
            input.setValidFrom(LocalDate.now());
        }
        if (input.getInstructionCode() == null || input.getInstructionCode().isBlank()) {
            input.setInstructionCode(generateInstructionCode());
        } else if (repository.countByInstructionCode(input.getInstructionCode()) > 0) {
            throw new ConflictException("Instruction code \"" + input.getInstructionCode() + "\" is already in use.");
        }
        return repository.save(input);
    }

    /**
     * The maker-checker gate: whoever created the SSI cannot also verify it
     * — that would make the control theatre, not a real second-person check.
     * Verifying supersedes whatever ACTIVE SSI currently occupies the same
     * routing key (our_entity_id/counterparty_id/direction/currency_id/
     * product_scope), closing its valid_to the day before this one starts
     * and linking it forward via superseded_by_id — never a silent overwrite.
     */
    @Transactional
    public SettlementInstruction verify(Integer id, String verificationMethod) {
        SettlementInstruction instruction = get(id);
        if (instruction.getStatus() != SettlementInstruction.Status.PENDING_VERIFICATION) {
            throw new ConflictException("Only a PENDING_VERIFICATION instruction can be verified (current status: "
                    + instruction.getStatus() + ").");
        }
        String currentUser = currentUsername();
        if (currentUser.equals(instruction.getCreatedBy())) {
            throw new ConflictException("The settlement instruction must be verified by someone other than the person who created it.");
        }

        // saveAndFlush (not save) — the superseded row's UPDATE must actually
        // reach the DB before the one below sets this row to ACTIVE, or the
        // filtered unique index (only one open-ended ACTIVE row per routing
        // key) sees both rows as ACTIVE at once and rejects the second
        // statement. Hibernate's default end-of-transaction flush does not
        // guarantee these two UPDATEs execute in call order since they're
        // two different managed instances of the same entity type.
        repository.findByOurEntityIdAndCounterpartyIdAndDirectionAndCurrencyIdAndProductScopeAndStatusAndValidToIsNull(
                        instruction.getOurEntityId(), instruction.getCounterpartyId(), instruction.getDirection(),
                        instruction.getCurrencyId(), instruction.getProductScope(), SettlementInstruction.Status.ACTIVE)
                .ifPresent(previous -> {
                    previous.setStatus(SettlementInstruction.Status.SUPERSEDED);
                    previous.setValidTo(instruction.getValidFrom().minusDays(1));
                    previous.setSupersededById(instruction.getSettlementInstructionId());
                    repository.saveAndFlush(previous);
                });

        instruction.setStatus(SettlementInstruction.Status.ACTIVE);
        instruction.setVerifiedBy(currentUser);
        instruction.setVerifiedAt(LocalDateTime.now());
        instruction.setVerificationMethod(verificationMethod);
        return repository.save(instruction);
    }

    @Transactional
    public SettlementInstruction reject(Integer id, String notes) {
        SettlementInstruction instruction = get(id);
        if (instruction.getStatus() != SettlementInstruction.Status.PENDING_VERIFICATION) {
            throw new ConflictException("Only a PENDING_VERIFICATION instruction can be rejected (current status: "
                    + instruction.getStatus() + ").");
        }
        instruction.setStatus(SettlementInstruction.Status.REJECTED);
        if (notes != null && !notes.isBlank()) {
            instruction.setNotes(notes);
        }
        return repository.save(instruction);
    }

    private void validateAccountOwnership(SettlementInstruction.Direction direction, BankAccount account,
                                           Integer counterpartyId, Integer ourEntityId) {
        boolean ownedByCounterparty = account.getEntityType() == EntityType.COUNTERPARTY
                && account.getEntityId().equals(counterpartyId);
        boolean ownedByUs = account.getEntityType() == EntityType.LEGAL_ENTITY
                && account.getEntityId().equals(ourEntityId);

        boolean valid = switch (direction) {
            case PAY -> ownedByCounterparty;
            case RECEIVE -> ownedByUs;
            case BOTH -> ownedByCounterparty || ownedByUs;
        };
        if (!valid) {
            throw new ConflictException(
                    "For direction " + direction + ", the bank account must belong to "
                            + (direction == SettlementInstruction.Direction.RECEIVE ? "our own legal entity" : "the counterparty")
                            + " — the account selected belongs to " + account.getEntityType() + " " + account.getEntityId() + ".");
        }
    }

    private String currentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "SYSTEM";
        }
        return auth.getName();
    }

    private String generateInstructionCode() {
        long next = repository.count() + 1;
        String candidate;
        do {
            candidate = String.format("SSI-%06d", next++);
        } while (repository.countByInstructionCode(candidate) > 0);
        return candidate;
    }
}
