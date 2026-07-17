package com.etrm.system.regulatoryobligation;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/contracts/regulatory-obligations/api.ts. */
@RestController
@RequestMapping("/api/v1/compliance/obligations")
public class RegulatoryObligationController {

    private final RegulatoryObligationService service;

    public RegulatoryObligationController(RegulatoryObligationService service) {
        this.service = service;
    }

    @GetMapping
    public List<RegulatoryObligation> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<RegulatoryObligation> create(@Valid @RequestBody RegulatoryObligation input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public RegulatoryObligation update(@PathVariable Integer id, @Valid @RequestBody RegulatoryObligation input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
