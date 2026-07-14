package com.etrm.system.collateral;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/collateral/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/collateral")
public class CollateralController {

    private final CollateralService service;

    public CollateralController(CollateralService service) {
        this.service = service;
    }

    @GetMapping
    public List<Collateral> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Collateral> create(@Valid @RequestBody Collateral input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Collateral update(@PathVariable Integer id, @Valid @RequestBody Collateral input) {
        return service.update(id, input);
    }
}
