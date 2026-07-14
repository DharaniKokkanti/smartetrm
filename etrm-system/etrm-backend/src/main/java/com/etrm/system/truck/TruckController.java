package com.etrm.system.truck;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/trucks/api.ts.
 */
@RestController
@RequestMapping("/api/v1/trucks")
public class TruckController {

    private final TruckService service;

    public TruckController(TruckService service) {
        this.service = service;
    }

    @GetMapping
    public List<Truck> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Truck> create(@Valid @RequestBody Truck input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Truck update(@PathVariable Integer id, @Valid @RequestBody Truck input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
