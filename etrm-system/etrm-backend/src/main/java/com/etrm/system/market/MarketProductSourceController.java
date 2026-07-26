package com.etrm.system.market;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class MarketProductSourceController {

    private final MarketProductSourceService service;

    public MarketProductSourceController(MarketProductSourceService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/market-product-links/{marketProductLinkId}/sources")
    public List<MarketProductSource> list(@PathVariable Integer marketProductLinkId) {
        return service.list(marketProductLinkId);
    }
}
