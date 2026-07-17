package com.etrm.system.paymentterm;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/contracts/payment-terms/api.ts. */
@RestController
@RequestMapping("/api/v1/payment-terms")
public class PaymentTermController {

    private final PaymentTermService service;

    public PaymentTermController(PaymentTermService service) {
        this.service = service;
    }

    @GetMapping
    public List<PaymentTerm> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<PaymentTerm> create(@Valid @RequestBody PaymentTerm input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public PaymentTerm update(@PathVariable Integer id, @Valid @RequestBody PaymentTerm input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
