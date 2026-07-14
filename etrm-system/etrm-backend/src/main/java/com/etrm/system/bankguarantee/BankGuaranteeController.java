package com.etrm.system.bankguarantee;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/bank-guarantees/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/bank-guarantees")
public class BankGuaranteeController {

    private final BankGuaranteeService service;

    public BankGuaranteeController(BankGuaranteeService service) {
        this.service = service;
    }

    @GetMapping
    public List<BankGuarantee> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<BankGuarantee> create(@Valid @RequestBody BankGuarantee input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public BankGuarantee update(@PathVariable Integer id, @Valid @RequestBody BankGuarantee input) {
        return service.update(id, input);
    }
}
