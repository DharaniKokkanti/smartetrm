package com.etrm.system.product;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with productBlendApi in products/api.ts. */
@RestController
@RequestMapping("/api/v1/products/{productId}/blend-components")
public class ProductBlendComponentController {

    private final ProductBlendComponentService service;

    public ProductBlendComponentController(ProductBlendComponentService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductBlendComponent> list(@PathVariable Integer productId) {
        return service.list(productId);
    }

    @PostMapping
    public ResponseEntity<ProductBlendComponent> create(@PathVariable Integer productId, @Valid @RequestBody ProductBlendComponent input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(productId, input));
    }

    @DeleteMapping("/{blendComponentId}")
    public ResponseEntity<Void> delete(@PathVariable Integer productId, @PathVariable Integer blendComponentId) {
        service.delete(blendComponentId);
        return ResponseEntity.noContent().build();
    }
}
