package com.etrm.system.settlementprice;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/pricing/settlement-prices/api.ts. */
@RestController
@RequestMapping("/api/v1/settlement-prices")
public class SettlementPriceController {

    private final SettlementPriceService service;

    public SettlementPriceController(SettlementPriceService service) {
        this.service = service;
    }

    @GetMapping
    public List<SettlementPrice> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<SettlementPrice> create(@Valid @RequestBody SettlementPrice input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public SettlementPrice update(@PathVariable Integer id, @Valid @RequestBody SettlementPrice input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/confirm")
    public SettlementPrice confirm(@PathVariable Integer id) {
        return service.confirm(id);
    }
}
