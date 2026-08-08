package com.etrm.system.clearingaccount;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/clearing-accounts/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/clearing-accounts")
public class ClearingAccountController {

    private final ClearingAccountService service;

    public ClearingAccountController(ClearingAccountService service) {
        this.service = service;
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
}
