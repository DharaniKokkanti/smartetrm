package com.etrm.system.insurancepolicy;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/insurance-policies/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/insurance-policies")
public class InsurancePolicyController {

    private final InsurancePolicyService service;

    public InsurancePolicyController(InsurancePolicyService service) {
        this.service = service;
    }

    @GetMapping
    public List<InsurancePolicy> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<InsurancePolicy> create(@Valid @RequestBody InsurancePolicy input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public InsurancePolicy update(@PathVariable Integer id, @Valid @RequestBody InsurancePolicy input) {
        return service.update(id, input);
    }
}
