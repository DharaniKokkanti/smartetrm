package com.etrm.system.product;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with productSpecApi.listTemplates/createTemplate in products/api.ts. */
@RestController
@RequestMapping("/api/v1/products/{productId}/spec-templates")
public class ProductSpecTemplateController {

    private final ProductSpecTemplateService service;

    public ProductSpecTemplateController(ProductSpecTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductSpecTemplate> list(@PathVariable Integer productId) {
        return service.list(productId);
    }

    @PostMapping
    public ResponseEntity<ProductSpecTemplate> create(@PathVariable Integer productId, @Valid @RequestBody ProductSpecTemplate input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(productId, input));
    }
}
