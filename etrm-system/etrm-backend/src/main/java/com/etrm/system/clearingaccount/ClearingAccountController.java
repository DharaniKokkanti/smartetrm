package com.etrm.system.clearingaccount;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.polymorphic.BankAccount;
import com.etrm.system.polymorphic.BankAccountRepository;
import com.etrm.system.polymorphic.EntityType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with etrm-frontend/src/features/credit/clearing-accounts/api.ts.
 * Address links are NOT a sub-resource here -- clearing accounts use the
 * existing generic /api/v1/entity-addresses?entityType=CLEARING_ACCOUNT
 * endpoint (AddressContactController), same as every other polymorphic
 * entity that links addresses via AddressesSection.tsx.
 */
@RestController
@RequestMapping("/api/v1/credit/clearing-accounts")
public class ClearingAccountController {

    private final ClearingAccountService service;
    private final BankAccountRepository bankAccountRepository;

    public ClearingAccountController(ClearingAccountService service, BankAccountRepository bankAccountRepository) {
        this.service = service;
        this.bankAccountRepository = bankAccountRepository;
    }

    @GetMapping
    public List<ClearingAccount> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<ClearingAccount> create(@Valid @RequestBody ClearingAccount input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public ClearingAccount update(@PathVariable Integer id, @Valid @RequestBody ClearingAccount input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    // ── Bank accounts (bank_account.entity_id is INT) — V213 ────────────────

    @GetMapping("/{id}/bank-accounts")
    public List<BankAccount> listBankAccounts(@PathVariable Integer id) {
        return bankAccountRepository.findByEntityTypeAndEntityId(EntityType.CLEARING_ACCOUNT, id);
    }

    @PostMapping("/{id}/bank-accounts")
    public ResponseEntity<BankAccount> addBankAccount(@PathVariable Integer id, @Valid @RequestBody BankAccount input) {
        service.get(id);
        input.setBankAccountId(null);
        input.setEntityType(EntityType.CLEARING_ACCOUNT);
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
        input.setEntityType(EntityType.CLEARING_ACCOUNT);
        input.setEntityId(id);
        return bankAccountRepository.save(input);
    }
}
