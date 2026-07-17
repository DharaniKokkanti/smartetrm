package com.etrm.system.rinobligation;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with etrm-frontend/src/features/environmental/rin-obligations/api.ts.
 * No deactivate endpoint — frontend api.ts only has list/create/update.
 */
@RestController
@RequestMapping("/api/v1/rin-obligations")
public class RinObligationController {

    private final RinObligationService service;

    public RinObligationController(RinObligationService service) {
        this.service = service;
    }

    @GetMapping
    public List<RinObligation> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<RinObligation> create(@Valid @RequestBody RinObligation input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public RinObligation update(@PathVariable Integer id, @Valid @RequestBody RinObligation input) {
        return service.update(id, input);
    }
}
