package com.etrm.system.marginagreement;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/margin-agreements/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/margin-agreements")
public class MarginAgreementController {

    private final MarginAgreementService service;

    public MarginAgreementController(MarginAgreementService service) {
        this.service = service;
    }

    @GetMapping
    public List<MarginAgreement> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<MarginAgreement> create(@Valid @RequestBody MarginAgreement input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public MarginAgreement update(@PathVariable Integer id, @Valid @RequestBody MarginAgreement input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
