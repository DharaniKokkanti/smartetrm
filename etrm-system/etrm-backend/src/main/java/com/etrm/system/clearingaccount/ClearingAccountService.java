package com.etrm.system.clearingaccount;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClearingAccountService {

    private final ClearingAccountRepository repository;
    private final CounterpartyRepository counterpartyRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final CurrencyRepository currencyRepository;

    public ClearingAccountService(ClearingAccountRepository repository, CounterpartyRepository counterpartyRepository,
                                   LegalEntityRepository legalEntityRepository, CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.counterpartyRepository = counterpartyRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.currencyRepository = currencyRepository;
    }

    private ClearingAccount hydrate(ClearingAccount ca) {
        counterpartyRepository.findById(ca.getClearingBrokerId()).ifPresent(cp -> ca.setClearingBrokerName(cp.getLegalName()));
        legalEntityRepository.findById(ca.getLegalEntityId()).ifPresent(le -> ca.setLegalEntityName(le.getEntityName()));
        currencyRepository.findById(ca.getBaseCurrencyId()).ifPresent(c -> ca.setBaseCurrencyCode(c.getCurrencyCode()));
        return ca;
    }

    @Transactional(readOnly = true)
    public List<ClearingAccount> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public ClearingAccount create(ClearingAccount input) {
        input.setClearingAccountId(null);
        return hydrate(repository.save(input));
    }

    public ClearingAccount update(Integer id, ClearingAccount input) {
        ClearingAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No clearing account with id " + id + "."));
        input.setClearingAccountId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        ClearingAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No clearing account with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
