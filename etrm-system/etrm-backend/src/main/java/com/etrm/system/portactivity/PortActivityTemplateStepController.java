package com.etrm.system.portactivity;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/voyage-ops/port-activity-templates/api.ts. */
@RestController
@RequestMapping("/api/v1/voyage-ops/port-activity-template-steps")
public class PortActivityTemplateStepController {

    private final PortActivityTemplateStepService service;

    public PortActivityTemplateStepController(PortActivityTemplateStepService service) {
        this.service = service;
    }

    @GetMapping
    public List<PortActivityTemplateStep> list(@RequestParam(required = false) Integer templateId) {
        return service.list(templateId);
    }

    @PostMapping
    public ResponseEntity<PortActivityTemplateStep> create(@Valid @RequestBody PortActivityTemplateStep input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public PortActivityTemplateStep update(@PathVariable Integer id, @Valid @RequestBody PortActivityTemplateStep input) {
        return service.update(id, input);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
