package com.etrm.system.transportroute;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/logistics/transport-routes/api.ts. */
@RestController
@RequestMapping("/api/v1/freight/routes")
public class TransportRouteController {

    private final TransportRouteService service;

    public TransportRouteController(TransportRouteService service) {
        this.service = service;
    }

    @GetMapping
    public List<TransportRoute> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<TransportRoute> create(@Valid @RequestBody TransportRoute input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public TransportRoute update(@PathVariable Integer id, @Valid @RequestBody TransportRoute input) {
        return service.update(id, input);
    }
}
