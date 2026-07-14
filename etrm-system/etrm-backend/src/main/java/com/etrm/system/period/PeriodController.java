package com.etrm.system.period;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/calendar/periods/api.ts. */
@RestController
@RequestMapping("/api/v1/periods")
public class PeriodController {

    private final PeriodService service;

    public PeriodController(PeriodService service) {
        this.service = service;
    }

    @GetMapping
    public List<Period> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Period> create(@Valid @RequestBody Period input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Period update(@PathVariable Integer id, @Valid @RequestBody Period input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
