package com.etrm.system.pricesource;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/pricing/price-sources/api.ts. */
@RestController
@RequestMapping("/api/v1/price-sources")
public class PriceSourceController {

    private final PriceSourceService service;

    public PriceSourceController(PriceSourceService service) {
        this.service = service;
    }

    @GetMapping
    public List<PriceSource> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<PriceSource> create(@Valid @RequestBody PriceSource input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public PriceSource update(@PathVariable Integer id, @Valid @RequestBody PriceSource input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
