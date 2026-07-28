package com.etrm.system.optionindexlink;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/pricing/option-index-links/api.ts.
 */
@RestController
public class OptionIndexLinkController {

    private final OptionIndexLinkService service;

    public OptionIndexLinkController(OptionIndexLinkService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/option-index-links")
    public List<OptionIndexLink> list() {
        return service.list();
    }

    @PostMapping("/api/v1/option-index-links")
    public ResponseEntity<OptionIndexLink> create(@Valid @RequestBody OptionIndexLink input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/api/v1/option-index-links/{id}")
    public OptionIndexLink update(@PathVariable Integer id, @Valid @RequestBody OptionIndexLink input) {
        return service.update(id, input);
    }

    @PatchMapping("/api/v1/option-index-links/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
