package com.etrm.system.legalentity;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class LegalEntityService {

    private final LegalEntityRepository repository;
    private final LegalEntityRowInserter rowInserter;

    public LegalEntityService(LegalEntityRepository repository, LegalEntityRowInserter rowInserter) {
        this.repository = repository;
        this.rowInserter = rowInserter;
    }

    @Transactional(readOnly = true)
    public List<LegalEntity> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public LegalEntity get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No legal entity with id " + id + "."));
    }

    /** entity_code and short_name are code-style fields — conventionally
     *  uppercase everywhere in this schema — so normalize server-side
     *  regardless of how the value was cased on entry. */
    private void normalizeCodeFields(LegalEntity input) {
        if (input.getEntityCode() != null) input.setEntityCode(input.getEntityCode().toUpperCase());
        if (input.getShortName() != null) input.setShortName(input.getShortName().toUpperCase());
    }

    public LegalEntity create(LegalEntity input) {
        normalizeCodeFields(input);
        if (repository.existsByEntityCodeIgnoreCase(input.getEntityCode())) {
            throw new ConflictException("Entity Code \"" + input.getEntityCode() + "\" already exists.");
        }
        input.setLegalEntityId(null);
        input.setIsActive(true);
        input.setDeactivatedDate(null);
        return repository.save(input);
    }

    public LegalEntity update(Integer id, LegalEntity input) {
        LegalEntity existing = get(id);
        normalizeCodeFields(input);
        // entity_code is immutable after creation — matches the frontend
        // form, which disables that field once editing
        input.setLegalEntityId(id);
        input.setEntityCode(existing.getEntityCode());
        input.setIsActive(existing.getIsActive());
        input.setDeactivatedDate(existing.getDeactivatedDate());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        LegalEntity existing = get(id);
        existing.setIsActive(false);
        existing.setDeactivatedDate(LocalDate.now());
        repository.save(existing);
    }

    /** Mirrors the frontend's bulk-upload review flow: duplicates are
     *  rejected with a reason, not silently skipped or merged, and a
     *  partial batch still commits everything that DID pass — including
     *  rows after one that fails a DB constraint (e.g. an invalid
     *  jurisdiction/incorporation-country/base-currency code), since each
     *  row is inserted via {@link LegalEntityRowInserter} in its own
     *  transaction rather than this method's shared one. */
    public BulkResult bulkCreate(List<LegalEntity> inputs) {
        List<LegalEntity> created = new java.util.ArrayList<>();
        List<RejectedRow> rejected = new java.util.ArrayList<>();

        for (LegalEntity input : inputs) {
            normalizeCodeFields(input);
            if (repository.existsByEntityCodeIgnoreCase(input.getEntityCode())) {
                rejected.add(new RejectedRow(input, "Entity Code \"" + input.getEntityCode() + "\" already exists."));
                continue;
            }
            try {
                created.add(rowInserter.insert(input));
            } catch (DataIntegrityViolationException ex) {
                rejected.add(new RejectedRow(input,
                        "Row rejected — violates a database constraint (e.g. jurisdiction, incorporation country, "
                                + "or base currency is not a recognised code)."));
            }
        }
        return new BulkResult(created, rejected);
    }

    public record RejectedRow(LegalEntity row, String reason) {}
    public record BulkResult(List<LegalEntity> created, List<RejectedRow> rejected) {}
}
