package com.etrm.system.market;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MarketProductPeriodController {

    private final MarketProductPeriodService service;

    public MarketProductPeriodController(MarketProductPeriodService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/market-products/{marketProductId}/periods")
    public List<MarketProductPeriod> list(@PathVariable Integer marketProductId) {
        return service.list(marketProductId);
    }

    public record AddPeriodRequest(@NotNull Integer periodId) {}

    @PostMapping("/api/v1/market-products/{marketProductId}/periods")
    public MarketProductPeriod add(@PathVariable Integer marketProductId, @Valid @RequestBody AddPeriodRequest request) {
        return service.add(marketProductId, request.periodId());
    }

    @PatchMapping("/api/v1/market-product-periods/{mppId}/deactivate")
    public void deactivate(@PathVariable Integer mppId) {
        service.deactivate(mppId);
    }
}
