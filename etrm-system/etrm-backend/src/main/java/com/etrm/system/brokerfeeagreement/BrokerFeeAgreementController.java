package com.etrm.system.brokerfeeagreement;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/contracts/broker-fee-agreements/api.ts. */
@RestController
@RequestMapping("/api/v1/broker-fee-agreements")
public class BrokerFeeAgreementController {

    private final BrokerFeeAgreementService service;

    public BrokerFeeAgreementController(BrokerFeeAgreementService service) {
        this.service = service;
    }

    @GetMapping
    public List<BrokerFeeAgreement> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<BrokerFeeAgreement> create(@Valid @RequestBody BrokerFeeAgreement input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public BrokerFeeAgreement update(@PathVariable Integer id, @Valid @RequestBody BrokerFeeAgreement input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
