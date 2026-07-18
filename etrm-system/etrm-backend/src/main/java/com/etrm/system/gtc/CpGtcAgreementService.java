package com.etrm.system.gtc;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CpGtcAgreementService {

    private final CpGtcAgreementRepository repository;
    private final CounterpartyRepository counterpartyRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final GtcRepository gtcRepository;
    private final GtcVersionRepository gtcVersionRepository;

    public CpGtcAgreementService(CpGtcAgreementRepository repository, CounterpartyRepository counterpartyRepository,
                                  LegalEntityRepository legalEntityRepository, GtcRepository gtcRepository,
                                  GtcVersionRepository gtcVersionRepository) {
        this.repository = repository;
        this.counterpartyRepository = counterpartyRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.gtcRepository = gtcRepository;
        this.gtcVersionRepository = gtcVersionRepository;
    }

    private CpGtcAgreement hydrate(CpGtcAgreement agreement) {
        counterpartyRepository.findById(agreement.getCounterpartyId())
                .ifPresent(cp -> agreement.setCounterpartyName(cp.getLegalName()));
        legalEntityRepository.findById(agreement.getLegalEntityId())
                .ifPresent(le -> agreement.setLegalEntityName(le.getEntityName()));
        gtcVersionRepository.findById(agreement.getGtcVersionId()).ifPresent(v -> {
            agreement.setGtcId(v.getGtcId());
            agreement.setGtcVersion(v.getVersionNumber());
            gtcRepository.findById(v.getGtcId()).ifPresent(g -> agreement.setGtcName(g.getGtcName()));
        });
        return agreement;
    }

    /** Frontend sends gtcId; the DB stores the current version's gtc_version_id. */
    private void resolveGtcVersion(CpGtcAgreement input) {
        Integer gtcId = input.getGtcId();
        if (gtcId == null) return;
        input.setGtcVersionId(gtcVersionRepository.findByGtcIdAndIsCurrentTrue(gtcId)
                .orElseThrow(() -> new NotFoundException("No current version for GTC id " + gtcId + "."))
                .getGtcVersionId());
    }

    @Transactional(readOnly = true)
    public List<CpGtcAgreement> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public CpGtcAgreement create(CpGtcAgreement input) {
        resolveGtcVersion(input);
        input.setCpGtcId(null);
        return hydrate(repository.save(input));
    }

    public CpGtcAgreement update(Integer id, CpGtcAgreement input) {
        CpGtcAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GTC agreement with id " + id + "."));
        resolveGtcVersion(input);
        input.setCpGtcId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing only
        // populates those on insert, so the request body never carries them;
        // without copying them from the existing row here, updatable=false
        // keeps the DB value untouched but the response would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        CpGtcAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GTC agreement with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
