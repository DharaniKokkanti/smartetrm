package com.etrm.system.market;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MarketProductController {

    private final MarketProductService service;

    public MarketProductController(MarketProductService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/markets/{marketId}/products")
    public List<MarketProduct> list(@PathVariable Integer marketId) {
        return service.listByMarket(marketId);
    }

    @GetMapping("/api/v1/products/{productId}/markets")
    public List<MarketProduct> listByProduct(@PathVariable Integer productId) {
        return service.listByProduct(productId);
    }

    @PostMapping("/api/v1/markets/{marketId}/products")
    public MarketProduct create(@PathVariable Integer marketId, @Valid @RequestBody MarketProduct input) {
        return service.create(marketId, input);
    }

    @PutMapping("/api/v1/markets/{marketId}/products/{marketProductId}")
    public MarketProduct update(@PathVariable Integer marketId, @PathVariable Integer marketProductId,
                                 @Valid @RequestBody MarketProduct input) {
        return service.update(marketId, marketProductId, input);
    }

    @PatchMapping("/api/v1/markets/{marketId}/products/{marketProductId}/deactivate")
    public void deactivate(@PathVariable Integer marketId, @PathVariable Integer marketProductId) {
        service.deactivate(marketProductId);
    }
}
