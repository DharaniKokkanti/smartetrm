package com.etrm.system.licenseregistration;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.polymorphic.EntityType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape mirrors TaxRegistrationController exactly — see that
 * class's doc comment. Must stay in sync with
 * etrm-frontend/src/features/tier1/counterparty/api.ts's
 * fetchEntityLicenseRegistrations/fetchAllLicenseRegistrations/
 * saveLicenseRegistrationAssignment/deactivateLicenseRegistrationAssignment.
 */
@RestController
@RequestMapping("/api/v1/entity-license-registrations")
public class LicenseRegistrationController {

    private final LicenseRegistrationRepository repository;

    public LicenseRegistrationController(LicenseRegistrationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<LicenseRegistration> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Integer entityId) {
        if (entityType != null && entityId != null) {
            return repository.findByEntityTypeAndEntityId(EntityType.valueOf(entityType), entityId);
        }
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<LicenseRegistration> create(@Valid @RequestBody LicenseRegistration input) {
        input.setLicenseRegId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(input));
    }

    @PutMapping("/{id}")
    public LicenseRegistration update(@PathVariable Integer id, @Valid @RequestBody LicenseRegistration input) {
        LicenseRegistration existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No license registration with id " + id + "."));
        input.setLicenseRegId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        LicenseRegistration existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No license registration with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
        return ResponseEntity.noContent().build();
    }
}
