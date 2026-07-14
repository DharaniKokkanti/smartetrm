package com.etrm.system.commercialterms;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/counterparties/commercial-terms/api.ts. */
@RestController
@RequestMapping("/api/v1/counterparties/commercial-terms")
public class CpCommercialTermsController {

    private final CpCommercialTermsService service;

    public CpCommercialTermsController(CpCommercialTermsService service) {
        this.service = service;
    }

    @GetMapping
    public List<CpCommercialTerms> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<CpCommercialTerms> create(@Valid @RequestBody CpCommercialTerms input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public CpCommercialTerms update(@PathVariable Integer id, @Valid @RequestBody CpCommercialTerms input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
