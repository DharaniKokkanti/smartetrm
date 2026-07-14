package com.etrm.system.taxregistration;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.polymorphic.EntityType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/tier1/counterparty/api.ts's
 * fetchEntityTaxRegistrations/fetchAllTaxRegistrations/
 * saveTaxRegistrationAssignment/deactivateTaxRegistrationAssignment.
 * Filter-by-entity convention (?entityType=&entityId=) mirrors
 * AddressContactController's entity-addresses/entity-contacts endpoints.
 */
@RestController
@RequestMapping("/api/v1/entity-tax-registrations")
public class TaxRegistrationController {

    private final TaxRegistrationRepository repository;

    public TaxRegistrationController(TaxRegistrationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TaxRegistration> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Integer entityId) {
        if (entityType != null && entityId != null) {
            return repository.findByEntityTypeAndEntityId(EntityType.valueOf(entityType), entityId);
        }
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<TaxRegistration> create(@Valid @RequestBody TaxRegistration input) {
        input.setTaxRegId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(input));
    }

    @PutMapping("/{id}")
    public TaxRegistration update(@PathVariable Integer id, @Valid @RequestBody TaxRegistration input) {
        TaxRegistration existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No tax registration with id " + id + "."));
        input.setTaxRegId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        TaxRegistration existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No tax registration with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
        return ResponseEntity.noContent().build();
    }
}
