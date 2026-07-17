package com.etrm.system.rinaccount;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/environmental/rin-accounts/api.ts. */
@RestController
@RequestMapping("/api/v1/rin-accounts")
public class RinAccountController {

    private final RinAccountService service;

    public RinAccountController(RinAccountService service) {
        this.service = service;
    }

    @GetMapping
    public List<RinAccount> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<RinAccount> create(@Valid @RequestBody RinAccount input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public RinAccount update(@PathVariable Integer id, @Valid @RequestBody RinAccount input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
