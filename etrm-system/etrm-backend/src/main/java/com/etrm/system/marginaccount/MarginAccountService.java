package com.etrm.system.marginaccount;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.market.MarketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class MarginAccountService {

    private final MarginAccountRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final MarketRepository marketRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final CurrencyRepository currencyRepository;

    public MarginAccountService(MarginAccountRepository repository, LegalEntityRepository legalEntityRepository,
                                 MarketRepository marketRepository, CounterpartyRepository counterpartyRepository,
                                 CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.marketRepository = marketRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.currencyRepository = currencyRepository;
    }

    private MarginAccount hydrate(MarginAccount ma) {
        legalEntityRepository.findById(ma.getLegalEntityId()).ifPresent(le -> ma.setLegalEntityName(le.getEntityName()));
        marketRepository.findById(ma.getMarketId()).ifPresent(m -> ma.setMarketName(m.getMarketName()));
        if (ma.getClearingBrokerId() != null) {
            counterpartyRepository.findById(ma.getClearingBrokerId()).ifPresent(cp -> ma.setClearingBrokerName(cp.getLegalName()));
        }
        currencyRepository.findById(ma.getCurrencyId()).ifPresent(c -> ma.setCurrencyCode(c.getCurrencyCode()));
        return ma;
    }

    @Transactional(readOnly = true)
    public List<MarginAccount> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public MarginAccount create(MarginAccount input) {
        input.setMarginAccountId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public MarginAccount update(Integer id, MarginAccount input) {
        MarginAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin account with id " + id + "."));
        input.setMarginAccountId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        MarginAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin account with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
