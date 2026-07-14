package com.etrm.system.market;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.period.PeriodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class MarketProductPeriodService {

    private final MarketProductPeriodRepository repository;
    private final PeriodRepository periodRepository;

    public MarketProductPeriodService(MarketProductPeriodRepository repository, PeriodRepository periodRepository) {
        this.repository = repository;
        this.periodRepository = periodRepository;
    }

    private MarketProductPeriod hydrate(MarketProductPeriod mpp) {
        periodRepository.findById(mpp.getPeriodId()).ifPresent(p -> {
            mpp.setPeriodCode(p.getPeriodCode());
            mpp.setPeriodName(p.getPeriodName());
            mpp.setPeriodType(p.getPeriodType());
        });
        return mpp;
    }

    @Transactional(readOnly = true)
    public List<MarketProductPeriod> list(Integer marketProductId) {
        return repository.findByMarketProductId(marketProductId).stream().map(this::hydrate).toList();
    }

    public MarketProductPeriod add(Integer marketProductId, Integer periodId) {
        MarketProductPeriod mpp = new MarketProductPeriod();
        mpp.setMarketProductId(marketProductId);
        mpp.setPeriodId(periodId);
        mpp.setIsActive(true);
        mpp.setDatesPopulatedAt(LocalDateTime.now());
        return hydrate(repository.save(mpp));
    }

    public void deactivate(Integer mppId) {
        MarketProductPeriod existing = repository.findById(mppId)
                .orElseThrow(() -> new NotFoundException("No market product period with id " + mppId + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
