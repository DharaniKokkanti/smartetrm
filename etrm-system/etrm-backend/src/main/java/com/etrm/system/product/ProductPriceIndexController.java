package com.etrm.system.product;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with productIndexApi in etrm-frontend/src/features/markets/products/api.ts. */
@RestController
@RequestMapping("/api/v1/products/{productId}/price-indices")
public class ProductPriceIndexController {

    private final ProductPriceIndexService service;

    public ProductPriceIndexController(ProductPriceIndexService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductPriceIndex> list(@PathVariable Integer productId) {
        return service.list(productId);
    }

    @PostMapping
    public ResponseEntity<ProductPriceIndex> link(@PathVariable Integer productId, @Valid @RequestBody ProductPriceIndex input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.link(productId, input));
    }

    @DeleteMapping("/{productIndexId}")
    public ResponseEntity<Void> unlink(@PathVariable Integer productId, @PathVariable Integer productIndexId) {
        service.unlink(productIndexId);
        return ResponseEntity.noContent().build();
    }
}
