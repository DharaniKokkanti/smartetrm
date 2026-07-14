package com.etrm.system.desk;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/organization/desks/api.ts. */
@RestController
@RequestMapping("/api/v1/desks")
public class DeskController {

    private final DeskService service;

    public DeskController(DeskService service) {
        this.service = service;
    }

    @GetMapping
    public List<Desk> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public Desk get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<Desk> create(@Valid @RequestBody Desk input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Desk update(@PathVariable Integer id, @Valid @RequestBody Desk input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
