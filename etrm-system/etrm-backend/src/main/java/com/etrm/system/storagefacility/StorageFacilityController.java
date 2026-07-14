package com.etrm.system.storagefacility;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/storage/api.ts.
 */
@RestController
@RequestMapping("/api/v1/storage")
public class StorageFacilityController {

    private final StorageFacilityService service;

    public StorageFacilityController(StorageFacilityService service) {
        this.service = service;
    }

    @GetMapping
    public List<StorageFacility> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<StorageFacility> create(@Valid @RequestBody StorageFacility input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public StorageFacility update(@PathVariable Integer id, @Valid @RequestBody StorageFacility input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
