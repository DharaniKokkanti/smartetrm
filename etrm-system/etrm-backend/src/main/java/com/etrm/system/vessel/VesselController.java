package com.etrm.system.vessel;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/vessels/api.ts.
 */
@RestController
@RequestMapping("/api/v1/vessels")
public class VesselController {

    private final VesselService service;

    public VesselController(VesselService service) {
        this.service = service;
    }

    @GetMapping
    public List<Vessel> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Vessel> create(@Valid @RequestBody Vessel input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Vessel update(@PathVariable Integer id, @Valid @RequestBody Vessel input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
