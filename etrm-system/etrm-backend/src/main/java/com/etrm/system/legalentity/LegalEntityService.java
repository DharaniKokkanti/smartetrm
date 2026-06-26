package com.etrm.system.legalentity;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class LegalEntityService {

    private final LegalEntityRepository repository;

    public LegalEntityService(LegalEntityRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<LegalEntity> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public LegalEntity get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No legal entity with id " + id + "."));
    }

    public LegalEntity create(LegalEntity input) {
        if (repository.existsByEntityCodeIgnoreCase(input.getEntityCode())) {
            throw new ConflictException("Entity Code \"" + input.getEntityCode() + "\" already exists.");
        }
        input.setLegalEntityId(null);
        input.setIsActive(true);
        input.setDeactivatedDate(null);
        return repository.save(input);
    }

    public LegalEntity update(Long id, LegalEntity input) {
        LegalEntity existing = get(id);
        // entity_code is immutable after creation — matches the frontend
        // form, which disables that field once editing
        input.setLegalEntityId(id);
        input.setEntityCode(existing.getEntityCode());
        input.setIsActive(existing.getIsActive());
        input.setDeactivatedDate(existing.getDeactivatedDate());
        return repository.save(input);
    }

    public void deactivate(Long id) {
        LegalEntity existing = get(id);
        existing.setIsActive(false);
        existing.setDeactivatedDate(LocalDate.now());
        repository.save(existing);
    }

    /** Mirrors the frontend's bulk-upload review flow: duplicates are
     *  rejected with a reason, not silently skipped or merged, and a
     *  partial batch still commits everything that DID pass. */
    public BulkResult bulkCreate(List<LegalEntity> inputs) {
        List<LegalEntity> created = new java.util.ArrayList<>();
        List<RejectedRow> rejected = new java.util.ArrayList<>();

        for (LegalEntity input : inputs) {
            if (repository.existsByEntityCodeIgnoreCase(input.getEntityCode())) {
                rejected.add(new RejectedRow(input, "Entity Code \"" + input.getEntityCode() + "\" already exists."));
                continue;
            }
            input.setLegalEntityId(null);
            input.setIsActive(true);
            input.setDeactivatedDate(null);
            created.add(repository.save(input));
        }
        return new BulkResult(created, rejected);
    }

    public record RejectedRow(LegalEntity row, String reason) {}
    public record BulkResult(List<LegalEntity> created, List<RejectedRow> rejected) {}
}
