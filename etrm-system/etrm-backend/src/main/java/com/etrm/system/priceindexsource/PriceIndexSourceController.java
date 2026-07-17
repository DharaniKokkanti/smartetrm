package com.etrm.system.priceindexsource;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/pricing/price-index-sources/api.ts AND
 * etrm-frontend/src/features/pricing/price-sources/api.ts (which also calls
 * this controller's sub-resource GET /price-sources/{id}/index-links —
 * see listByPriceSource below).
 */
@RestController
public class PriceIndexSourceController {

    private final PriceIndexSourceService service;

    public PriceIndexSourceController(PriceIndexSourceService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/price-index-sources")
    public List<PriceIndexSource> list() {
        return service.list();
    }

    @GetMapping("/api/v1/price-sources/{priceSourceId}/index-links")
    public List<PriceIndexSource> listByPriceSource(@PathVariable Integer priceSourceId) {
        return service.listByPriceSource(priceSourceId);
    }

    @PostMapping("/api/v1/price-index-sources")
    public ResponseEntity<PriceIndexSource> create(@Valid @RequestBody PriceIndexSource input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/api/v1/price-index-sources/{id}")
    public PriceIndexSource update(@PathVariable Integer id, @Valid @RequestBody PriceIndexSource input) {
        return service.update(id, input);
    }

    @PatchMapping("/api/v1/price-index-sources/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
