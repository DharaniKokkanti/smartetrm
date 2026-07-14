package com.etrm.system.currency;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/reference/currencies/api.ts — this is the
 * contract the frontend was built against.
 */
@RestController
@RequestMapping("/api/v1/currencies")
public class CurrencyController {

    private final CurrencyService service;

    public CurrencyController(CurrencyService service) {
        this.service = service;
    }

    @GetMapping
    public List<Currency> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Currency> create(@Valid @RequestBody Currency input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Currency update(@PathVariable Integer id, @Valid @RequestBody Currency input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
