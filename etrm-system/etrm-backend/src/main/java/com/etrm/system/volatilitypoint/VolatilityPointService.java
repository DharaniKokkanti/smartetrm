package com.etrm.system.volatilitypoint;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.optionindexlink.OptionIndexLinkRepository;
import com.etrm.system.period.PeriodRepository;
import com.etrm.system.priceindex.PriceIndexRepository;
import com.etrm.system.pricesource.PriceSourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VolatilityPointService {

    private final VolatilityPointRepository repository;
    private final OptionIndexLinkRepository optionIndexLinkRepository;
    private final PriceIndexRepository priceIndexRepository;
    private final PeriodRepository periodRepository;
    private final PriceSourceRepository priceSourceRepository;

    public VolatilityPointService(VolatilityPointRepository repository,
                                   OptionIndexLinkRepository optionIndexLinkRepository,
                                   PriceIndexRepository priceIndexRepository,
                                   PeriodRepository periodRepository,
                                   PriceSourceRepository priceSourceRepository) {
        this.repository = repository;
        this.optionIndexLinkRepository = optionIndexLinkRepository;
        this.priceIndexRepository = priceIndexRepository;
        this.periodRepository = periodRepository;
        this.priceSourceRepository = priceSourceRepository;
    }

    private VolatilityPoint hydrate(VolatilityPoint vp) {
        optionIndexLinkRepository.findById(vp.getOptionIndexLinkId())
                .ifPresent(link -> priceIndexRepository.findById(link.getOptionPriceIndexId())
                        .ifPresent(idx -> vp.setOptionIndexCode(idx.getIndexCode())));
        periodRepository.findById(vp.getPeriodId()).ifPresent(p -> vp.setPeriodCode(p.getPeriodCode()));
        priceSourceRepository.findById(vp.getPriceSourceId()).ifPresent(src -> vp.setSourceCode(src.getSourceCode()));
        return vp;
    }

    @Transactional(readOnly = true)
    public List<VolatilityPoint> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public List<VolatilityPoint> listByOptionIndexLink(Integer optionIndexLinkId) {
        return repository.findByOptionIndexLinkId(optionIndexLinkId).stream().map(this::hydrate).toList();
    }

    public VolatilityPoint create(VolatilityPoint input) {
        input.setVolatilityPointId(null);
        return hydrate(repository.save(input));
    }

    public VolatilityPoint update(Integer id, VolatilityPoint input) {
        VolatilityPoint existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No volatility point with id " + id + "."));
        input.setVolatilityPointId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public VolatilityPoint confirm(Integer id) {
        VolatilityPoint existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No volatility point with id " + id + "."));
        existing.setIsConfirmed(true);
        return hydrate(repository.save(existing));
    }
}
