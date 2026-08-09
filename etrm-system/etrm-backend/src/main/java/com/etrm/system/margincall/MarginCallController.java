package com.etrm.system.margincall;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/margin-calls/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/margin-calls")
public class MarginCallController {

    private final MarginCallService service;

    public MarginCallController(MarginCallService service) {
        this.service = service;
    }

    @GetMapping
    public List<MarginCall> list(@RequestParam Integer marginAccountId) {
        return service.listByMarginAccount(marginAccountId);
    }

    @PostMapping
    public ResponseEntity<MarginCall> create(@Valid @RequestBody MarginCall input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public MarginCall update(@PathVariable Integer id, @Valid @RequestBody MarginCall input) {
        return service.update(id, input);
    }
}
