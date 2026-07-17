package com.etrm.system.uom;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/reference/uom/api.ts. */
@RestController
@RequestMapping("/api/v1/uom")
public class UnitOfMeasureController {

    private final UnitOfMeasureService service;

    public UnitOfMeasureController(UnitOfMeasureService service) {
        this.service = service;
    }

    @GetMapping
    public List<UnitOfMeasure> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<UnitOfMeasure> create(@Valid @RequestBody UnitOfMeasure input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public UnitOfMeasure update(@PathVariable Integer id, @Valid @RequestBody UnitOfMeasure input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
