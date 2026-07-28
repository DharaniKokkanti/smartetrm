package com.etrm.system.volatilitypoint;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/pricing/volatility-points/api.ts.
 */
@RestController
public class VolatilityPointController {

    private final VolatilityPointService service;

    public VolatilityPointController(VolatilityPointService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/volatility-points")
    public List<VolatilityPoint> list() {
        return service.list();
    }

    @GetMapping("/api/v1/option-index-links/{optionIndexLinkId}/volatility-points")
    public List<VolatilityPoint> listByOptionIndexLink(@PathVariable Integer optionIndexLinkId) {
        return service.listByOptionIndexLink(optionIndexLinkId);
    }

    @PostMapping("/api/v1/volatility-points")
    public ResponseEntity<VolatilityPoint> create(@Valid @RequestBody VolatilityPoint input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/api/v1/volatility-points/{id}")
    public VolatilityPoint update(@PathVariable Integer id, @Valid @RequestBody VolatilityPoint input) {
        return service.update(id, input);
    }

    @PatchMapping("/api/v1/volatility-points/{id}/confirm")
    public VolatilityPoint confirm(@PathVariable Integer id) {
        return service.confirm(id);
    }
}
