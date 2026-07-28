package com.etrm.system.tickermapping;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/pricing/ticker-mappings/api.ts.
 */
@RestController
public class TickerMappingController {

    private final TickerMappingService service;

    public TickerMappingController(TickerMappingService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/ticker-mappings")
    public List<TickerMapping> list() {
        return service.list();
    }

    @PostMapping("/api/v1/ticker-mappings")
    public ResponseEntity<TickerMapping> create(@Valid @RequestBody TickerMapping input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/api/v1/ticker-mappings/{id}")
    public TickerMapping update(@PathVariable Integer id, @Valid @RequestBody TickerMapping input) {
        return service.update(id, input);
    }

    @PatchMapping("/api/v1/ticker-mappings/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/ticker-mappings/auto-generate")
    public List<TickerMapping> autoGenerate(@Valid @RequestBody AutoGenerateRequest request) {
        return service.autoGenerate(request.anchorTickerMappingId(), request.count());
    }

    public record AutoGenerateRequest(Integer anchorTickerMappingId, Integer count) {}
}
