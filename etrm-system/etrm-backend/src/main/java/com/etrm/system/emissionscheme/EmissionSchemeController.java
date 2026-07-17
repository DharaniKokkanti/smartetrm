package com.etrm.system.emissionscheme;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/environmental/emission-schemes/api.ts. */
@RestController
@RequestMapping("/api/v1/emission-schemes")
public class EmissionSchemeController {

    private final EmissionSchemeService service;

    public EmissionSchemeController(EmissionSchemeService service) {
        this.service = service;
    }

    @GetMapping
    public List<EmissionScheme> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<EmissionScheme> create(@Valid @RequestBody EmissionScheme input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public EmissionScheme update(@PathVariable Integer id, @Valid @RequestBody EmissionScheme input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
