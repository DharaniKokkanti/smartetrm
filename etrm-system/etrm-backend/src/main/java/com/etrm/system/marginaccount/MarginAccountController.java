package com.etrm.system.marginaccount;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/margin-accounts/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/margin-accounts")
public class MarginAccountController {

    private final MarginAccountService service;

    public MarginAccountController(MarginAccountService service) {
        this.service = service;
    }

    @GetMapping
    public List<MarginAccount> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<MarginAccount> create(@Valid @RequestBody MarginAccount input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public MarginAccount update(@PathVariable Integer id, @Valid @RequestBody MarginAccount input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
