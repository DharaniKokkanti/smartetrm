package com.etrm.system.clearingaccount;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/clearing-accounts/marginRatesApi.ts. */
@RestController
@RequestMapping("/api/v1/credit/clearing-account-margin-rates")
public class ClearingAccountMarginRateController {

    private final ClearingAccountMarginRateService service;

    public ClearingAccountMarginRateController(ClearingAccountMarginRateService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClearingAccountMarginRate> list(@RequestParam Integer clearingAccountId) {
        return service.listByClearingAccount(clearingAccountId);
    }

    @PostMapping
    public ResponseEntity<ClearingAccountMarginRate> create(@Valid @RequestBody ClearingAccountMarginRate input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public ClearingAccountMarginRate update(@PathVariable Integer id, @Valid @RequestBody ClearingAccountMarginRate input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
