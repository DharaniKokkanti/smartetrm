package com.etrm.system.polymorphic;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Cross-entity directory of every bank account across every owning entity —
 * used by BankAccountsDirectoryPage.tsx. Per-entity CRUD (add/update a bank
 * account scoped to one counterparty) already lives on
 * CounterpartyController's /{id}/bank-accounts sub-resource; this is the only
 * piece that was actually missing (confirmed live: GET /bank-accounts 404'd,
 * everything else already worked).
 */
@RestController
@RequestMapping("/api/v1/bank-accounts")
public class BankAccountController {

    private final BankAccountRepository repository;

    public BankAccountController(BankAccountRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<BankAccount> listAll() {
        return repository.findAll();
    }
}
