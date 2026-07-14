package com.etrm.system.pipeline;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/pipeline-tariffs/api.ts.
 */
@RestController
@RequestMapping("/api/v1/logistics/pipeline-tariffs")
public class PipelineTariffController {

    private final PipelineTariffService service;

    public PipelineTariffController(PipelineTariffService service) {
        this.service = service;
    }

    @GetMapping
    public List<PipelineTariff> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<PipelineTariff> create(@Valid @RequestBody PipelineTariff input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public PipelineTariff update(@PathVariable Integer id, @Valid @RequestBody PipelineTariff input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
