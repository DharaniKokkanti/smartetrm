package com.etrm.system.nettingagreement;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class NettingAgreementService {

    private final NettingAgreementRepository repository;
    private final CounterpartyRepository counterpartyRepository;
    private final LegalEntityRepository legalEntityRepository;

    public NettingAgreementService(NettingAgreementRepository repository, CounterpartyRepository counterpartyRepository,
                                    LegalEntityRepository legalEntityRepository) {
        this.repository = repository;
        this.counterpartyRepository = counterpartyRepository;
        this.legalEntityRepository = legalEntityRepository;
    }

    private NettingAgreement hydrate(NettingAgreement agreement) {
        counterpartyRepository.findById(agreement.getCounterpartyId())
                .ifPresent(cp -> agreement.setCounterpartyName(cp.getLegalName()));
        legalEntityRepository.findById(agreement.getLegalEntityId())
                .ifPresent(le -> agreement.setLegalEntityName(le.getEntityName()));
        return agreement;
    }

    @Transactional(readOnly = true)
    public List<NettingAgreement> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public NettingAgreement create(NettingAgreement input) {
        input.setNettingId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public NettingAgreement update(Integer id, NettingAgreement input) {
        NettingAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No netting agreement with id " + id + "."));
        input.setNettingId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        NettingAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No netting agreement with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
