package com.etrm.system.rintransaction;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with etrm-frontend/src/features/environmental/rin-transactions/api.ts.
 * No PUT/update endpoint — frontend api.ts only has list/create/void.
 */
@RestController
@RequestMapping("/api/v1/rin-transactions")
public class RinTransactionController {

    private final RinTransactionService service;

    public RinTransactionController(RinTransactionService service) {
        this.service = service;
    }

    @GetMapping
    public List<RinTransaction> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<RinTransaction> create(@Valid @RequestBody RinTransaction input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PatchMapping("/{id}/void")
    public RinTransaction voidTransaction(@PathVariable Integer id) {
        return service.voidTransaction(id);
    }
}
