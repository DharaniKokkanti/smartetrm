package com.etrm.system.tickermapping;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.period.PeriodRepository;
import com.etrm.system.priceindex.PriceIndexRepository;
import com.etrm.system.pricesource.PriceSourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TickerMappingService {

    private final TickerMappingRepository repository;
    private final PriceIndexRepository priceIndexRepository;
    private final PeriodRepository periodRepository;
    private final PriceSourceRepository priceSourceRepository;

    public TickerMappingService(TickerMappingRepository repository,
                                 PriceIndexRepository priceIndexRepository,
                                 PeriodRepository periodRepository,
                                 PriceSourceRepository priceSourceRepository) {
        this.repository = repository;
        this.priceIndexRepository = priceIndexRepository;
        this.periodRepository = periodRepository;
        this.priceSourceRepository = priceSourceRepository;
    }

    private TickerMapping hydrate(TickerMapping tm) {
        priceIndexRepository.findById(tm.getPriceIndexId()).ifPresent(idx -> {
            tm.setPriceIndexCode(idx.getIndexCode());
            tm.setPriceIndexName(idx.getIndexName());
        });
        if (tm.getPeriodId() != null) {
            periodRepository.findById(tm.getPeriodId()).ifPresent(p -> tm.setPeriodCode(p.getPeriodCode()));
        }
        priceSourceRepository.findById(tm.getPriceSourceId()).ifPresent(src -> {
            tm.setSourceCode(src.getSourceCode());
            tm.setSourceName(src.getSourceName());
        });
        return tm;
    }

    @Transactional(readOnly = true)
    public List<TickerMapping> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public TickerMapping create(TickerMapping input) {
        input.setTickerMappingId(null);
        return hydrate(repository.save(input));
    }

    public TickerMapping update(Integer id, TickerMapping input) {
        TickerMapping existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No ticker mapping with id " + id + "."));
        input.setTickerMappingId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        TickerMapping existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No ticker mapping with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
