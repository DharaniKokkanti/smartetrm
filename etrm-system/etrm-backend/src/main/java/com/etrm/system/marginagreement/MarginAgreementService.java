package com.etrm.system.marginagreement;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.lookup.GoverningLawTypeRepository;
import com.etrm.system.lookup.MarginAgreementTypeRepository;
import com.etrm.system.lookup.ValuationFrequencyTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MarginAgreementService {

    private final MarginAgreementRepository repository;
    private final CounterpartyRepository counterpartyRepository;
    private final MarginAgreementTypeRepository agreementTypeRepository;
    private final ValuationFrequencyTypeRepository valuationFrequencyTypeRepository;
    private final GoverningLawTypeRepository governingLawTypeRepository;

    public MarginAgreementService(MarginAgreementRepository repository, CounterpartyRepository counterpartyRepository,
                                   MarginAgreementTypeRepository agreementTypeRepository,
                                   ValuationFrequencyTypeRepository valuationFrequencyTypeRepository,
                                   GoverningLawTypeRepository governingLawTypeRepository) {
        this.repository = repository;
        this.counterpartyRepository = counterpartyRepository;
        this.agreementTypeRepository = agreementTypeRepository;
        this.valuationFrequencyTypeRepository = valuationFrequencyTypeRepository;
        this.governingLawTypeRepository = governingLawTypeRepository;
    }

    private MarginAgreement hydrate(MarginAgreement agreement) {
        counterpartyRepository.findById(agreement.getCounterpartyId())
                .ifPresent(cp -> agreement.setCounterpartyName(cp.getLegalName()));
        if (agreement.getAgreementTypeId() != null) {
            agreementTypeRepository.findById(agreement.getAgreementTypeId())
                    .ifPresent(t -> agreement.setAgreementType(t.getTypeCode()));
        }
        if (agreement.getValuationFrequencyId() != null) {
            valuationFrequencyTypeRepository.findById(agreement.getValuationFrequencyId())
                    .ifPresent(t -> agreement.setValuationFrequency(t.getTypeCode()));
        }
        if (agreement.getGovLawId() != null) {
            governingLawTypeRepository.findById(agreement.getGovLawId())
                    .ifPresent(t -> agreement.setGovLaw(t.getTypeCode()));
        }
        return agreement;
    }

    private void resolveForeignKeys(MarginAgreement input) {
        if (input.getAgreementType() != null) {
            input.setAgreementTypeId(agreementTypeRepository.findByTypeCodeIgnoreCase(input.getAgreementType())
                    .orElseThrow(() -> new NotFoundException("No margin agreement type \"" + input.getAgreementType() + "\"."))
                    .getMarginAgreementTypeId());
        }
        if (input.getValuationFrequency() != null) {
            input.setValuationFrequencyId(valuationFrequencyTypeRepository.findByTypeCodeIgnoreCase(input.getValuationFrequency())
                    .orElseThrow(() -> new NotFoundException("No valuation frequency \"" + input.getValuationFrequency() + "\"."))
                    .getValuationFrequencyTypeId());
        }
        if (input.getGovLaw() != null) {
            input.setGovLawId(governingLawTypeRepository.findByTypeCodeIgnoreCase(input.getGovLaw())
                    .orElseThrow(() -> new NotFoundException("No governing law \"" + input.getGovLaw() + "\"."))
                    .getGoverningLawTypeId());
        }
    }

    @Transactional(readOnly = true)
    public List<MarginAgreement> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public MarginAgreement create(MarginAgreement input) {
        resolveForeignKeys(input);
        input.setMarginAgreementId(null);
        return hydrate(repository.save(input));
    }

    public MarginAgreement update(Integer id, MarginAgreement input) {
        MarginAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin agreement with id " + id + "."));
        resolveForeignKeys(input);
        input.setMarginAgreementId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        MarginAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin agreement with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
