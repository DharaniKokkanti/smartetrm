package com.etrm.system.pipeline;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/pipeline-cycles/api.ts.
 */
@RestController
@RequestMapping("/api/v1/logistics/pipeline-cycles")
public class PipelineCycleController {

    private final PipelineCycleService service;

    public PipelineCycleController(PipelineCycleService service) {
        this.service = service;
    }

    @GetMapping
    public List<PipelineCycle> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<PipelineCycle> create(@Valid @RequestBody PipelineCycle input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public PipelineCycle update(@PathVariable Integer id, @Valid @RequestBody PipelineCycle input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
