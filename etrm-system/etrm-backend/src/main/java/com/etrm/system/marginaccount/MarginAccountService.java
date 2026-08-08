package com.etrm.system.marginaccount;

import com.etrm.system.clearingaccount.ClearingAccountRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.market.MarketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MarginAccountService {

    private final MarginAccountRepository repository;
    private final ClearingAccountRepository clearingAccountRepository;
    private final MarketRepository marketRepository;

    public MarginAccountService(MarginAccountRepository repository, ClearingAccountRepository clearingAccountRepository,
                                 MarketRepository marketRepository) {
        this.repository = repository;
        this.clearingAccountRepository = clearingAccountRepository;
        this.marketRepository = marketRepository;
    }

    private MarginAccount hydrate(MarginAccount ma) {
        clearingAccountRepository.findById(ma.getClearingAccountId()).ifPresent(ca -> ma.setClearingAccountCode(ca.getAccountCode()));
        marketRepository.findById(ma.getMarketId()).ifPresent(m -> ma.setMarketName(m.getMarketName()));
        return ma;
    }

    @Transactional(readOnly = true)
    public List<MarginAccount> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public MarginAccount create(MarginAccount input) {
        input.setMarginAccountId(null);
        return hydrate(repository.save(input));
    }

    public MarginAccount update(Integer id, MarginAccount input) {
        MarginAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin account with id " + id + "."));
        input.setMarginAccountId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing only
        // populates those on insert, so the request body never carries them;
        // without copying them from the existing row here, updatable=false
        // keeps the DB value untouched but the response would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        MarginAccount existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin account with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
