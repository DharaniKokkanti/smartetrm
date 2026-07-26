package com.etrm.system.period;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inserts a single period in its own, independent transaction — same
 * REQUIRES_NEW rationale as LegalEntityRowInserter: without it, one bad row
 * (e.g. an FK violation) mid-batch leaves the shared transaction
 * rollback-only and silently fails every row after it.
 */
@Service
class PeriodRowInserter {

    private final PeriodRepository repository;

    PeriodRowInserter(PeriodRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Period insert(Period input) {
        input.setPeriodId(null);
        return repository.saveAndFlush(input);
    }
}
