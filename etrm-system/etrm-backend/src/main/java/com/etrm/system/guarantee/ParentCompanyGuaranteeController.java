package com.etrm.system.guarantee;

import com.etrm.system.polymorphic.EntityType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Path/verb shape, including the entityType/entityId query-param filter,
 * must stay in sync with
 * etrm-frontend/src/features/tier1/guarantee/api.ts.
 */
@RestController
@RequestMapping("/api/v1/parent-company-guarantees")
public class ParentCompanyGuaranteeController {

    private final ParentCompanyGuaranteeService service;

    public ParentCompanyGuaranteeController(ParentCompanyGuaranteeService service) {
        this.service = service;
    }

    @GetMapping
    public List<ParentCompanyGuarantee> list(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) Long entityId
    ) {
        if (entityType != null && entityId != null) {
            return service.listForEntity(entityType, entityId);
        }
        return service.list();
    }

    @PostMapping
    public ResponseEntity<ParentCompanyGuarantee> create(@Valid @RequestBody ParentCompanyGuarantee input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public ParentCompanyGuarantee update(@PathVariable Long id, @Valid @RequestBody ParentCompanyGuarantee input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
