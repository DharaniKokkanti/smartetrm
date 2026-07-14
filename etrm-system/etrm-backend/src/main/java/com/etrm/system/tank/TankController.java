package com.etrm.system.tank;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/tanks/api.ts.
 */
@RestController
@RequestMapping("/api/v1/logistics/tanks")
public class TankController {

    private final TankService service;

    public TankController(TankService service) {
        this.service = service;
    }

    @GetMapping
    public List<Tank> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Tank> create(@Valid @RequestBody Tank input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Tank update(@PathVariable Integer id, @Valid @RequestBody Tank input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
