package com.etrm.system.formulatemplate;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/pricing/formula-templates/api.ts. */
@RestController
@RequestMapping("/api/v1/pricing/formula-templates")
public class FormulaTemplateController {

    private final FormulaTemplateService service;

    public FormulaTemplateController(FormulaTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public List<FormulaTemplate> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<FormulaTemplate> create(@Valid @RequestBody FormulaTemplate input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public FormulaTemplate update(@PathVariable Integer id, @Valid @RequestBody FormulaTemplate input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
