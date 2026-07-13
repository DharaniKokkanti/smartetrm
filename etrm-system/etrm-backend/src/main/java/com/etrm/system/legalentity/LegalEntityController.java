package com.etrm.system.legalentity;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/tier1/legal-entity/api.ts — this is the
 * contract the frontend was built against.
 */
@RestController
@RequestMapping("/api/v1/legal-entities")
public class LegalEntityController {

    private final LegalEntityService service;

    public LegalEntityController(LegalEntityService service) {
        this.service = service;
    }

    @GetMapping
    public List<LegalEntity> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public LegalEntity get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<LegalEntity> create(@Valid @RequestBody LegalEntity input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public LegalEntity update(@PathVariable Integer id, @Valid @RequestBody LegalEntity input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk")
    public LegalEntityService.BulkResult bulkCreate(@RequestBody BulkCreateRequest request) {
        return service.bulkCreate(request.entities());
    }
}
