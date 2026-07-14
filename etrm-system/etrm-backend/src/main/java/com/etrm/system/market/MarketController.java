package com.etrm.system.market;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/markets/markets/api.ts's core market CRUD
 * only — the market-product/period/source sub-resource endpoints on that
 * same api.ts are NOT covered here yet (deferred along with the rest of
 * dbo.product's satellite tables — see handoff doc).
 */
@RestController
@RequestMapping("/api/v1/markets")
public class MarketController {

    private final MarketService service;

    public MarketController(MarketService service) {
        this.service = service;
    }

    @GetMapping
    public List<Market> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Market> create(@Valid @RequestBody Market input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Market update(@PathVariable Integer id, @Valid @RequestBody Market input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
