package com.etrm.system.nomination;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/operations/nominations/api.ts. */
@RestController
@RequestMapping("/api/v1/operations")
public class NominationController {

    private final NominationService service;

    public NominationController(NominationService service) {
        this.service = service;
    }

    @GetMapping("/nominations")
    public List<Nomination> list() {
        return service.list();
    }

    @PostMapping("/nominations")
    public ResponseEntity<Nomination> create(@Valid @RequestBody Nomination input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/nominations/{id}")
    public Nomination update(@PathVariable Integer id, @Valid @RequestBody Nomination input) {
        return service.update(id, input);
    }

    /**
     * Stub pending a future TradeOrder entity — no TradeOrder table/entity is
     * reachable from this codebase yet, so there is no data to build a picker
     * option list from. Returns an empty list rather than querying a
     * nonexistent join.
     */
    @GetMapping("/trade-order-options")
    public List<TradeOrderOption> tradeOrderOptions() {
        return Collections.emptyList();
    }
}
