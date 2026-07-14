package com.etrm.system.priceindex;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/markets/price-indices/api.ts. */
@RestController
@RequestMapping("/api/v1/price-indices")
public class PriceIndexController {

    private final PriceIndexService service;

    public PriceIndexController(PriceIndexService service) {
        this.service = service;
    }

    @GetMapping
    public List<PriceIndex> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<PriceIndex> create(@Valid @RequestBody PriceIndex input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public PriceIndex update(@PathVariable Integer id, @Valid @RequestBody PriceIndex input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
