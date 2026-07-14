package com.etrm.system.container;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/containers/api.ts.
 */
@RestController
@RequestMapping("/api/v1/logistics/containers")
public class ContainerController {

    private final ContainerService service;

    public ContainerController(ContainerService service) {
        this.service = service;
    }

    @GetMapping
    public List<Container> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Container> create(@Valid @RequestBody Container input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Container update(@PathVariable Integer id, @Valid @RequestBody Container input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
