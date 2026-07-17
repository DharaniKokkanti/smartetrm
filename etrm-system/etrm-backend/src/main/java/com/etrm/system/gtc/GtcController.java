package com.etrm.system.gtc;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/contracts/gtcs/api.ts. */
@RestController
@RequestMapping("/api/v1/gtcs")
public class GtcController {

    private final GtcService service;

    public GtcController(GtcService service) {
        this.service = service;
    }

    @GetMapping
    public List<Gtc> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Gtc> create(@Valid @RequestBody Gtc input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Gtc update(@PathVariable Integer id, @Valid @RequestBody Gtc input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
