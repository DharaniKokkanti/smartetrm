package com.etrm.system.market;

import com.etrm.system.pricesource.PriceSourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MarketProductSourceService {

    private final MarketProductSourceRepository repository;
    private final PriceSourceRepository priceSourceRepository;

    public MarketProductSourceService(MarketProductSourceRepository repository, PriceSourceRepository priceSourceRepository) {
        this.repository = repository;
        this.priceSourceRepository = priceSourceRepository;
    }

    public List<MarketProductSource> list(Integer marketProductId) {
        return repository.findByMarketProductId(marketProductId).stream().map(mps -> {
            priceSourceRepository.findById(mps.getPriceSourceId()).ifPresent(ps -> {
                mps.setSourceCode(ps.getSourceCode());
                mps.setSourceName(ps.getSourceName());
            });
            return mps;
        }).toList();
    }
}
