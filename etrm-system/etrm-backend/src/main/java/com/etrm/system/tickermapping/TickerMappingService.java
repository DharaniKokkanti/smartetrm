package com.etrm.system.tickermapping;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.period.Period;
import com.etrm.system.period.PeriodRepository;
import com.etrm.system.priceindex.PriceIndexRepository;
import com.etrm.system.pricesource.PriceSourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class TickerMappingService {

    private static final int MAX_AUTO_GENERATE_ITERATIONS = 36;

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

    /**
     * Rolls an anchor ticker mapping forward onto the next {@code count}
     * already-existing Periods for the same market_product_link (Periods
     * are NOT created here — that's Period's own auto-generate feature;
     * this only rolls tickers onto periods that already exist). Each of the
     * anchor's 9 ticker fields is rolled independently via
     * {@link TickerRollCalculator#roll} — fields that don't follow the
     * root+month-code+year convention (e.g. a Platts assessment code) come
     * back null and are simply not carried forward, rather than guessed at.
     * Periods that already have a ticker_mapping row for this index+source
     * are skipped, not overwritten.
     */
    public List<TickerMapping> autoGenerate(Integer anchorId, Integer count) {
        if (count == null || count < 1 || count > MAX_AUTO_GENERATE_ITERATIONS) {
            throw new ConflictException("Count must be between 1 and " + MAX_AUTO_GENERATE_ITERATIONS + ".");
        }
        TickerMapping anchor = repository.findById(anchorId)
                .orElseThrow(() -> new NotFoundException("No ticker mapping with id " + anchorId + "."));
        if (anchor.getPeriodId() == null) {
            throw new ConflictException("Anchor ticker mapping has no Period set — a rolling/continuous ticker (no fixed tenor) can't be auto-rolled. Pick a tenor-specific anchor instead.");
        }
        Period anchorPeriod = periodRepository.findById(anchor.getPeriodId())
                .orElseThrow(() -> new NotFoundException("No period with id " + anchor.getPeriodId() + "."));
        if (anchorPeriod.getStartDate() == null) {
            throw new ConflictException("Anchor's period has no start date — auto-generate needs a dated period to roll forward from.");
        }

        List<Period> candidatePeriods = periodRepository.findByMarketProductLinkId(anchorPeriod.getMarketProductLinkId()).stream()
                .filter(p -> p.getStartDate() != null && p.getStartDate().isAfter(anchorPeriod.getStartDate()))
                .sorted(Comparator.comparing(Period::getStartDate))
                .toList();
        if (candidatePeriods.size() < count) {
            throw new ConflictException("Only " + candidatePeriods.size() + " future period(s) exist for this listing after the anchor — run Period auto-generate first to create more periods, then retry.");
        }

        List<TickerMapping> generated = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Period target = candidatePeriods.get(i);
            if (repository.existsByPriceIndexIdAndPeriodIdAndPriceSourceId(anchor.getPriceIndexId(), target.getPeriodId(), anchor.getPriceSourceId())) {
                continue;
            }
            TickerMapping next = new TickerMapping();
            next.setPriceIndexId(anchor.getPriceIndexId());
            next.setPeriodId(target.getPeriodId());
            next.setPriceSourceId(anchor.getPriceSourceId());
            next.setSettleTicker(TickerRollCalculator.roll(anchor.getSettleTicker(), target.getStartDate()));
            next.setOpenTicker(TickerRollCalculator.roll(anchor.getOpenTicker(), target.getStartDate()));
            next.setHighTicker(TickerRollCalculator.roll(anchor.getHighTicker(), target.getStartDate()));
            next.setLowTicker(TickerRollCalculator.roll(anchor.getLowTicker(), target.getStartDate()));
            next.setAvgTicker(TickerRollCalculator.roll(anchor.getAvgTicker(), target.getStartDate()));
            next.setPromptTicker(TickerRollCalculator.roll(anchor.getPromptTicker(), target.getStartDate()));
            next.setBidTicker(TickerRollCalculator.roll(anchor.getBidTicker(), target.getStartDate()));
            next.setAskTicker(TickerRollCalculator.roll(anchor.getAskTicker(), target.getStartDate()));
            next.setMidTicker(TickerRollCalculator.roll(anchor.getMidTicker(), target.getStartDate()));
            if (next.getSettleTicker() == null && next.getOpenTicker() == null && next.getHighTicker() == null
                    && next.getLowTicker() == null && next.getAvgTicker() == null && next.getPromptTicker() == null
                    && next.getBidTicker() == null && next.getAskTicker() == null && next.getMidTicker() == null) {
                continue;
            }
            next.setEffectiveFrom(target.getStartDate());
            next.setIsActive(true);
            generated.add(hydrate(repository.save(next)));
        }
        if (generated.isEmpty()) {
            throw new ConflictException("Nothing to generate — either every candidate period already has a ticker mapping for this index+source, or the anchor's ticker(s) don't follow a root+month-code+year convention that can be mechanically rolled (e.g. a Platts assessment code).");
        }
        return generated;
    }
}
