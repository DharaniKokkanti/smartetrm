package com.etrm.system.gtc;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/counterparties/gtc-agreements/api.ts. */
@RestController
@RequestMapping("/api/v1/counterparties/gtc-agreements")
public class CpGtcAgreementController {

    private final CpGtcAgreementService service;

    public CpGtcAgreementController(CpGtcAgreementService service) {
        this.service = service;
    }

    @GetMapping
    public List<CpGtcAgreement> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<CpGtcAgreement> create(@Valid @RequestBody CpGtcAgreement input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public CpGtcAgreement update(@PathVariable Integer id, @Valid @RequestBody CpGtcAgreement input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
