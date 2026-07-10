package com.etrm.system.legalentity;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inserts a single legal entity in its own, independent transaction.
 *
 * Used only by {@link LegalEntityService#bulkCreate}. A per-row
 * {@code try/catch} around a plain {@code repository.save(...)} is not
 * enough to isolate a bad row (e.g. one that violates the V87 jurisdiction/
 * incorporation-country/base-currency FKs): once Hibernate throws a
 * {@code DataIntegrityViolationException} mid-flush, the surrounding
 * transaction/session is left rollback-only, so every row after the bad one
 * would fail too even though nothing was wrong with them. REQUIRES_NEW gives
 * each row its own transaction, so one FK violation only rolls back that row.
 */
@Service
class LegalEntityRowInserter {

    private final LegalEntityRepository repository;

    LegalEntityRowInserter(LegalEntityRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public LegalEntity insert(LegalEntity input) {
        input.setLegalEntityId(null);
        input.setIsActive(true);
        input.setDeactivatedDate(null);
        return repository.saveAndFlush(input);
    }
}
