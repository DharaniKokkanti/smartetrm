package com.etrm.system.market;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MarketProductLinkController {

    private final MarketProductLinkService service;

    public MarketProductLinkController(MarketProductLinkService service) {
        this.service = service;
    }

    /** Flat, cross-market list — used by pickers (e.g. the Period screen)
     *  that need every market_product_link regardless of which market it's under. */
    @GetMapping("/api/v1/market-product-links")
    public List<MarketProductLink> listAll() {
        return service.listAll();
    }

    @GetMapping("/api/v1/markets/{marketId}/product-links")
    public List<MarketProductLink> list(@PathVariable Integer marketId) {
        return service.listByMarket(marketId);
    }

    @GetMapping("/api/v1/products/{productId}/market-links")
    public List<MarketProductLink> listByProduct(@PathVariable Integer productId) {
        return service.listByProduct(productId);
    }

    @PostMapping("/api/v1/markets/{marketId}/product-links")
    public MarketProductLink create(@PathVariable Integer marketId, @Valid @RequestBody MarketProductLink input) {
        return service.create(marketId, input);
    }

    @PutMapping("/api/v1/markets/{marketId}/product-links/{marketProductLinkId}")
    public MarketProductLink update(@PathVariable Integer marketId, @PathVariable Integer marketProductLinkId,
                                     @Valid @RequestBody MarketProductLink input) {
        return service.update(marketId, marketProductLinkId, input);
    }

    @PatchMapping("/api/v1/markets/{marketId}/product-links/{marketProductLinkId}/deactivate")
    public void deactivate(@PathVariable Integer marketId, @PathVariable Integer marketProductLinkId) {
        service.deactivate(marketProductLinkId);
    }
}
