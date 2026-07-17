package com.etrm.system.pricingrule;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/pricing/pricing-rules/api.ts. */
@RestController
@RequestMapping("/api/v1/pricing-rules")
public class PricingRuleController {

    private final PricingRuleService service;

    public PricingRuleController(PricingRuleService service) {
        this.service = service;
    }

    @GetMapping
    public List<PricingRule> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<PricingRule> create(@Valid @RequestBody PricingRule input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public PricingRule update(@PathVariable Integer id, @Valid @RequestBody PricingRule input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
