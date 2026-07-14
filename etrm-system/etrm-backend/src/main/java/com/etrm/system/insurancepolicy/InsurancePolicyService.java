package com.etrm.system.insurancepolicy;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.insuranceprovider.InsuranceProviderRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class InsurancePolicyService {

    private final InsurancePolicyRepository repository;
    private final InsuranceProviderRepository providerRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final CurrencyRepository currencyRepository;

    public InsurancePolicyService(InsurancePolicyRepository repository, InsuranceProviderRepository providerRepository,
                                   LegalEntityRepository legalEntityRepository, CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.providerRepository = providerRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.currencyRepository = currencyRepository;
    }

    private InsurancePolicy hydrate(InsurancePolicy p) {
        providerRepository.findById(p.getProviderId()).ifPresent(pr -> p.setProviderName(pr.getProviderName()));
        legalEntityRepository.findById(p.getLegalEntityId()).ifPresent(le -> p.setLegalEntityName(le.getEntityName()));
        currencyRepository.findById(p.getCurrencyId()).ifPresent(c -> p.setCurrencyCode(c.getCurrencyCode()));
        return p;
    }

    @Transactional(readOnly = true)
    public List<InsurancePolicy> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public InsurancePolicy create(InsurancePolicy input) {
        input.setPolicyId(null);
        return hydrate(repository.save(input));
    }

    public InsurancePolicy update(Integer id, InsurancePolicy input) {
        InsurancePolicy existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No insurance policy with id " + id + "."));
        input.setPolicyId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
