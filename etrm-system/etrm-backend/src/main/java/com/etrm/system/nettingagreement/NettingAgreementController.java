package com.etrm.system.nettingagreement;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/counterparties/netting-agreements/api.ts. */
@RestController
@RequestMapping("/api/v1/counterparties/netting-agreements")
public class NettingAgreementController {

    private final NettingAgreementService service;

    public NettingAgreementController(NettingAgreementService service) {
        this.service = service;
    }

    @GetMapping
    public List<NettingAgreement> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<NettingAgreement> create(@Valid @RequestBody NettingAgreement input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public NettingAgreement update(@PathVariable Integer id, @Valid @RequestBody NettingAgreement input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
