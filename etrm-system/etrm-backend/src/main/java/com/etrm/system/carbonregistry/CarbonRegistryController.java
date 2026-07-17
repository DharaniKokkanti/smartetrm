package com.etrm.system.carbonregistry;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/environmental/carbon-registries/api.ts. */
@RestController
@RequestMapping("/api/v1/carbon-registries")
public class CarbonRegistryController {

    private final CarbonRegistryService service;

    public CarbonRegistryController(CarbonRegistryService service) {
        this.service = service;
    }

    @GetMapping
    public List<CarbonRegistry> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<CarbonRegistry> create(@Valid @RequestBody CarbonRegistry input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public CarbonRegistry update(@PathVariable Integer id, @Valid @RequestBody CarbonRegistry input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
