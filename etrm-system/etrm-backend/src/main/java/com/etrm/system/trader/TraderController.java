package com.etrm.system.trader;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/organization/traders/api.ts. */
@RestController
@RequestMapping("/api/v1/traders")
public class TraderController {

    private final TraderService service;

    public TraderController(TraderService service) {
        this.service = service;
    }

    @GetMapping
    public List<Trader> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public Trader get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<Trader> create(@Valid @RequestBody Trader input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Trader update(@PathVariable Integer id, @Valid @RequestBody Trader input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
