package com.etrm.system.laytime;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/voyage-ops/laytime-calculations/api.ts. No PUT
 * endpoint — recalculation always POSTs a new version (see
 * LaytimeCalculationService.create's versioning contract).
 */
@RestController
@RequestMapping("/api/v1/voyage-ops/laytime-calculations")
public class LaytimeCalculationController {

    private final LaytimeCalculationService service;

    public LaytimeCalculationController(LaytimeCalculationService service) {
        this.service = service;
    }

    @GetMapping
    public List<LaytimeCalculation> list(@RequestParam(required = false) Integer voyageId) {
        return service.list(voyageId);
    }

    @PostMapping
    public ResponseEntity<LaytimeCalculation> create(@Valid @RequestBody LaytimeCalculation input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }
}
