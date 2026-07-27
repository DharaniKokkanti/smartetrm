package com.etrm.system.marketintervalprice;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/** Path/verb shape must stay in sync with the future etrm-frontend market-interval-prices feature. */
@RestController
@RequestMapping("/api/v1/market-interval-prices")
public class MarketIntervalPriceController {

    private final MarketIntervalPriceService service;

    public MarketIntervalPriceController(MarketIntervalPriceService service) {
        this.service = service;
    }

    @GetMapping
    public List<MarketIntervalPrice> list(
            @RequestParam Integer priceIndexId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return service.findByIndexAndRange(priceIndexId, from, to);
    }

    @PostMapping
    public ResponseEntity<MarketIntervalPrice> create(@Valid @RequestBody MarketIntervalPrice input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PatchMapping("/{id}/confirm")
    public MarketIntervalPrice confirm(@PathVariable Long id) {
        return service.confirm(id);
    }
}
