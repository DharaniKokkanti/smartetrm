package com.etrm.system.pipeline;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/pipelines/api.ts.
 */
@RestController
@RequestMapping("/api/v1/pipelines")
public class PipelineController {

    private final PipelineService service;

    public PipelineController(PipelineService service) {
        this.service = service;
    }

    @GetMapping
    public List<Pipeline> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Pipeline> create(@Valid @RequestBody Pipeline input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Pipeline update(@PathVariable Integer id, @Valid @RequestBody Pipeline input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
