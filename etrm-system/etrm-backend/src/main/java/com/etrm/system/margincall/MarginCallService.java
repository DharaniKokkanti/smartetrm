package com.etrm.system.margincall;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.marginaccount.MarginAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MarginCallService {

    private final MarginCallRepository repository;
    private final MarginAccountRepository marginAccountRepository;
    private final CurrencyRepository currencyRepository;

    public MarginCallService(MarginCallRepository repository, MarginAccountRepository marginAccountRepository,
                              CurrencyRepository currencyRepository) {
        this.repository = repository;
        this.marginAccountRepository = marginAccountRepository;
        this.currencyRepository = currencyRepository;
    }

    private MarginCall hydrate(MarginCall c) {
        marginAccountRepository.findById(c.getMarginAccountId()).ifPresent(a -> c.setMarginAccountCode(a.getAccountRef()));
        currencyRepository.findById(c.getCurrencyId()).ifPresent(cur -> c.setCurrencyCode(cur.getCurrencyCode()));
        return c;
    }

    @Transactional(readOnly = true)
    public List<MarginCall> listByMarginAccount(Integer marginAccountId) {
        return repository.findByMarginAccountIdOrderByCallDateDesc(marginAccountId).stream().map(this::hydrate).toList();
    }

    public MarginCall create(MarginCall input) {
        input.setCallId(null);
        return hydrate(repository.save(input));
    }

    public MarginCall update(Integer id, MarginCall input) {
        MarginCall existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No margin call with id " + id + "."));
        input.setCallId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }
}
