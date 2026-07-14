package com.etrm.system.location;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/locations/api.ts.
 */
@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

    private final LocationService service;

    public LocationController(LocationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Location> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Location> create(@Valid @RequestBody Location input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Location update(@PathVariable Integer id, @Valid @RequestBody Location input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
