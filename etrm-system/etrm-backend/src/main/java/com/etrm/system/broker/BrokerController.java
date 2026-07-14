package com.etrm.system.broker;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/organization/brokers/api.ts. */
@RestController
@RequestMapping("/api/v1/brokers")
public class BrokerController {

    private final BrokerService service;

    public BrokerController(BrokerService service) {
        this.service = service;
    }

    @GetMapping
    public List<Broker> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Broker> create(@Valid @RequestBody Broker input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Broker update(@PathVariable Integer id, @Valid @RequestBody Broker input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
