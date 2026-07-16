package com.etrm.system.voyage;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/voyage-ops/voyages/api.ts. */
@RestController
@RequestMapping("/api/v1/voyage-ops/voyages")
public class VoyageController {

    private final VoyageService service;

    public VoyageController(VoyageService service) {
        this.service = service;
    }

    @GetMapping
    public List<Voyage> list(@RequestParam(required = false) Integer vesselId,
                              @RequestParam(required = false) Integer charterPartyId) {
        return service.list(vesselId, charterPartyId);
    }

    @GetMapping("/{id}")
    public Voyage get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<Voyage> create(@Valid @RequestBody Voyage input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Voyage update(@PathVariable Integer id, @Valid @RequestBody Voyage input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
