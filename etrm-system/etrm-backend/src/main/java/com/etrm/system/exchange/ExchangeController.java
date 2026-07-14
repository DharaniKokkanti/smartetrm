package com.etrm.system.exchange;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/markets/exchanges/api.ts. */
@RestController
@RequestMapping("/api/v1/exchanges")
public class ExchangeController {

    private final ExchangeService service;

    public ExchangeController(ExchangeService service) {
        this.service = service;
    }

    @GetMapping
    public List<Exchange> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Exchange> create(@Valid @RequestBody Exchange input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Exchange update(@PathVariable Integer id, @Valid @RequestBody Exchange input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
