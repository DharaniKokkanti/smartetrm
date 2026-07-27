package com.etrm.system.marketintervalprice;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class MarketIntervalPriceService {

    private final MarketIntervalPriceRepository repository;

    public MarketIntervalPriceService(MarketIntervalPriceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<MarketIntervalPrice> findByIndexAndRange(Integer priceIndexId, LocalDateTime from, LocalDateTime to) {
        return repository.findByPriceIndexIdAndIntervalStartUtcBetweenOrderByIntervalStartUtc(priceIndexId, from, to);
    }

    public MarketIntervalPrice create(MarketIntervalPrice input) {
        input.setMarketIntervalPriceId(null);
        return repository.save(input);
    }

    public MarketIntervalPrice confirm(Long id) {
        MarketIntervalPrice existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No market interval price with id " + id + "."));
        existing.setIsConfirmed(true);
        return repository.save(existing);
    }
}
