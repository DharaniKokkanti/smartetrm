package com.etrm.system.marginoffsetrule;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/margin-offset-rules/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/margin-offset-rules")
public class MarginOffsetRuleController {

    private final MarginOffsetRuleService service;

    public MarginOffsetRuleController(MarginOffsetRuleService service) {
        this.service = service;
    }

    @GetMapping
    public List<MarginOffsetRule> list(@RequestParam Integer exchangeId) {
        return service.listByExchange(exchangeId);
    }

    @PostMapping
    public ResponseEntity<MarginOffsetRule> create(@Valid @RequestBody MarginOffsetRule input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public MarginOffsetRule update(@PathVariable Integer id, @Valid @RequestBody MarginOffsetRule input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
