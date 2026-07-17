package com.etrm.system.glaccount;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/finance/gl-accounts/api.ts. */
@RestController
@RequestMapping("/api/v1/gl-accounts")
public class GlAccountController {

    private final GlAccountService service;

    public GlAccountController(GlAccountService service) {
        this.service = service;
    }

    @GetMapping
    public List<GlAccount> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<GlAccount> create(@Valid @RequestBody GlAccount input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public GlAccount update(@PathVariable Integer id, @Valid @RequestBody GlAccount input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
