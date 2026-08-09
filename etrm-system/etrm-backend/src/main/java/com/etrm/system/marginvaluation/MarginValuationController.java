package com.etrm.system.marginvaluation;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/margin-valuations/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/margin-valuations")
public class MarginValuationController {

    private final MarginValuationService service;

    public MarginValuationController(MarginValuationService service) {
        this.service = service;
    }

    @GetMapping
    public List<MarginValuation> list(@RequestParam Integer clearingAccountId) {
        return service.listByClearingAccount(clearingAccountId);
    }

    @PostMapping
    public ResponseEntity<MarginValuation> create(@Valid @RequestBody MarginValuation input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public MarginValuation update(@PathVariable Long id, @Valid @RequestBody MarginValuation input) {
        return service.update(id, input);
    }
}
