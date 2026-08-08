package com.etrm.system.contractmarginrate;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/contract-margin-rates/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/contract-margin-rates")
public class ContractMarginRateController {

    private final ContractMarginRateService service;

    public ContractMarginRateController(ContractMarginRateService service) {
        this.service = service;
    }

    @GetMapping
    public List<ContractMarginRate> list(@RequestParam Integer contractSpecId) {
        return service.listByContractSpec(contractSpecId);
    }

    @PostMapping
    public ResponseEntity<ContractMarginRate> create(@Valid @RequestBody ContractMarginRate input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public ContractMarginRate update(@PathVariable Integer id, @Valid @RequestBody ContractMarginRate input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
