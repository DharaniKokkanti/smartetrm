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

    @GetMapping("/api/v1/market-product-links/{marketProductLinkId}/periods")
    public List<MarketProductPeriod> list(@PathVariable Integer marketProductLinkId) {
        return service.list(marketProductLinkId);
    }

    public record AddPeriodRequest(@NotNull Long periodId) {}

    @PostMapping("/api/v1/market-product-links/{marketProductLinkId}/periods")
    public MarketProductPeriod add(@PathVariable Integer marketProductLinkId, @Valid @RequestBody AddPeriodRequest request) {
        return service.add(marketProductLinkId, request.periodId());
    }

    @PatchMapping("/api/v1/market-product-periods/{mppId}/deactivate")
    public void deactivate(@PathVariable Integer mppId) {
        service.deactivate(mppId);
    }
}
