package com.etrm.system.incoterm;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/reference/incoterms/api.ts. */
@RestController
@RequestMapping("/api/v1/incoterms-ref")
public class IncotermController {

    private final IncotermService service;

    public IncotermController(IncotermService service) {
        this.service = service;
    }

    @GetMapping
    public List<Incoterm> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Incoterm> create(@Valid @RequestBody Incoterm input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Incoterm update(@PathVariable Integer id, @RequestBody Incoterm input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
