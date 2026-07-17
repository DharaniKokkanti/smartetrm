package com.etrm.system.emissionobligation;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with etrm-frontend/src/features/environmental/emission-obligations/api.ts.
 * No deactivate endpoint — frontend api.ts only has list/create/update.
 */
@RestController
@RequestMapping("/api/v1/emission-obligations")
public class EmissionObligationController {

    private final EmissionObligationService service;

    public EmissionObligationController(EmissionObligationService service) {
        this.service = service;
    }

    @GetMapping
    public List<EmissionObligation> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<EmissionObligation> create(@Valid @RequestBody EmissionObligation input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public EmissionObligation update(@PathVariable Integer id, @Valid @RequestBody EmissionObligation input) {
        return service.update(id, input);
    }
}
