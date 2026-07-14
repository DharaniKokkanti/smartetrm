package com.etrm.system.product;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with productSpecApi.getValues/
 * addValue/updateValue/deleteValue in products/api.ts — top-level under
 * /spec-templates, not nested under /products (matches that api.ts's own
 * path shape exactly).
 */
@RestController
@RequestMapping("/api/v1/spec-templates/{templateId}/values")
public class ProductSpecValueController {

    private final ProductSpecValueService service;

    public ProductSpecValueController(ProductSpecValueService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductSpecValue> list(@PathVariable Integer templateId) {
        return service.list(templateId);
    }

    @PostMapping
    public ResponseEntity<ProductSpecValue> create(@PathVariable Integer templateId, @Valid @RequestBody ProductSpecValue input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(templateId, input));
    }

    @PutMapping("/{specValueId}")
    public ProductSpecValue update(@PathVariable Integer templateId, @PathVariable Integer specValueId, @Valid @RequestBody ProductSpecValue input) {
        return service.update(templateId, specValueId, input);
    }

    @DeleteMapping("/{specValueId}")
    public ResponseEntity<Void> delete(@PathVariable Integer templateId, @PathVariable Integer specValueId) {
        service.delete(specValueId);
        return ResponseEntity.noContent().build();
    }
}
