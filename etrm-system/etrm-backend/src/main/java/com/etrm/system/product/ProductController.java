package com.etrm.system.product;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with the core product CRUD in
 * etrm-frontend/src/features/markets/products/api.ts — the many
 * sub-resource endpoints on that same file (price-indices, markets,
 * spec-templates, spec values, blend-components, reporting-groups) are NOT
 * covered here yet (deferred, see handoff doc).
 */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<Product> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody Product input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Integer id, @Valid @RequestBody Product input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
