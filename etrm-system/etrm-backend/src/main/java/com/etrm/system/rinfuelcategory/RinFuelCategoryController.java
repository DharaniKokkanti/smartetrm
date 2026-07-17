package com.etrm.system.rinfuelcategory;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/environmental/rin-fuel-categories/api.ts. */
@RestController
@RequestMapping("/api/v1/rin-fuel-categories")
public class RinFuelCategoryController {

    private final RinFuelCategoryService service;

    public RinFuelCategoryController(RinFuelCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<RinFuelCategory> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<RinFuelCategory> create(@Valid @RequestBody RinFuelCategory input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public RinFuelCategory update(@PathVariable Integer id, @Valid @RequestBody RinFuelCategory input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
