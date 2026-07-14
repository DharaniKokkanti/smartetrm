package com.etrm.system.creditlimit;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/credit-limits/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/limits")
public class CreditLimitController {

    private final CreditLimitService service;

    public CreditLimitController(CreditLimitService service) {
        this.service = service;
    }

    @GetMapping
    public List<CreditLimit> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<CreditLimit> create(@Valid @RequestBody CreditLimit input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public CreditLimit update(@PathVariable Integer id, @Valid @RequestBody CreditLimit input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<Void> suspend(@PathVariable Integer id) {
        service.suspend(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reinstate")
    public ResponseEntity<Void> reinstate(@PathVariable Integer id) {
        service.reinstate(id);
        return ResponseEntity.noContent().build();
    }
}
