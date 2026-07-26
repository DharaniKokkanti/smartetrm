package com.etrm.system.period;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.lookup.LookupResolutionService;
import com.etrm.system.market.MarketProductLink;
import com.etrm.system.market.MarketProductLinkRepository;
import com.etrm.system.market.MarketRepository;
import com.etrm.system.product.ProductRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class PeriodService {

    private static final String LOAD_TYPE_CATEGORY = "load_type";
    private static final String GAS_DAY_TYPE_CATEGORY = "gas_day_type";
    private static final int MAX_AUTO_GENERATE_ITERATIONS = 120;

    private final PeriodRepository repository;
    private final PeriodRowInserter rowInserter;
    private final MarketProductLinkRepository marketProductLinkRepository;
    private final MarketRepository marketRepository;
    private final ProductRepository productRepository;
    private final LookupResolutionService lookupResolutionService;

    public PeriodService(PeriodRepository repository, PeriodRowInserter rowInserter,
                          MarketProductLinkRepository marketProductLinkRepository, MarketRepository marketRepository,
                          ProductRepository productRepository, LookupResolutionService lookupResolutionService) {
        this.repository = repository;
        this.rowInserter = rowInserter;
        this.marketProductLinkRepository = marketProductLinkRepository;
        this.marketRepository = marketRepository;
        this.productRepository = productRepository;
        this.lookupResolutionService = lookupResolutionService;
    }

    private Period hydrate(Period period) {
        marketProductLinkRepository.findById(period.getMarketProductLinkId()).ifPresent(mp -> {
            productRepository.findById(mp.getProductId()).ifPresent(p -> period.setProductCode(p.getProductCode()));
            marketRepository.findById(mp.getMarketId()).ifPresent(m -> period.setMarketCode(m.getMarketCode()));
        });
        if (period.getLoadTypeLookupId() != null) {
            period.setLoadType(lookupResolutionService.codeForId(LOAD_TYPE_CATEGORY, period.getLoadTypeLookupId()));
        }
        if (period.getGasDayTypeLookupId() != null) {
            period.setGasDayType(lookupResolutionService.codeForId(GAS_DAY_TYPE_CATEGORY, period.getGasDayTypeLookupId()));
        }
        return period;
    }

    /** Resolves the frontend's string codes back to the FK ids the DB actually stores. */
    private void resolveForeignKeys(Period input) {
        input.setLoadTypeLookupId(input.getLoadType() == null ? null
                : lookupResolutionService.idForCode(LOAD_TYPE_CATEGORY, input.getLoadType()));
        input.setGasDayTypeLookupId(input.getGasDayType() == null ? null
                : lookupResolutionService.idForCode(GAS_DAY_TYPE_CATEGORY, input.getGasDayType()));
    }

    @Transactional(readOnly = true)
    public List<Period> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public List<Period> listByMarketProductLink(Integer marketProductLinkId) {
        return repository.findByMarketProductLinkId(marketProductLinkId).stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public Period get(Long id) {
        return hydrate(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No period with id " + id + ".")));
    }

    private void normalizeCodeField(Period input) {
        if (input.getPeriodCode() != null) input.setPeriodCode(input.getPeriodCode().toUpperCase());
    }

    private void requireMarketProductLink(Integer marketProductLinkId) {
        if (!marketProductLinkRepository.existsById(marketProductLinkId)) {
            throw new NotFoundException("No market product link with id " + marketProductLinkId + ".");
        }
    }

    public Period create(Period input) {
        normalizeCodeField(input);
        requireMarketProductLink(input.getMarketProductLinkId());
        if (repository.existsByPeriodCodeIgnoreCaseAndMarketProductLinkId(input.getPeriodCode(), input.getMarketProductLinkId())) {
            throw new ConflictException("Period Code \"" + input.getPeriodCode() + "\" already exists for this market product link.");
        }
        resolveForeignKeys(input);
        input.setPeriodId(null);
        return hydrate(repository.save(input));
    }

    public Period update(Long id, Period input) {
        Period existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No period with id " + id + "."));
        normalizeCodeField(input);
        requireMarketProductLink(input.getMarketProductLinkId());
        resolveForeignKeys(input);
        input.setPeriodId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing only
        // populates those on insert, so the request body never carries them;
        // copy from the existing row so the response doesn't show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Long id) {
        Period existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No period with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }

    /** Mirrors LegalEntityService.bulkCreate: duplicates rejected with a
     *  reason (not silently skipped/merged), each row inserted in its own
     *  transaction via PeriodRowInserter so one bad row doesn't sink the
     *  rest of the batch. */
    public BulkResult bulkCreate(List<Period> inputs) {
        List<Period> created = new ArrayList<>();
        List<RejectedRow> rejected = new ArrayList<>();

        for (Period input : inputs) {
            normalizeCodeField(input);
            if (input.getMarketProductLinkId() == null || !marketProductLinkRepository.existsById(input.getMarketProductLinkId())) {
                rejected.add(new RejectedRow(input, "Market product link id \"" + input.getMarketProductLinkId() + "\" was not found."));
                continue;
            }
            if (repository.existsByPeriodCodeIgnoreCaseAndMarketProductLinkId(input.getPeriodCode(), input.getMarketProductLinkId())) {
                rejected.add(new RejectedRow(input, "Period Code \"" + input.getPeriodCode() + "\" already exists for this market product link."));
                continue;
            }
            resolveForeignKeys(input);
            try {
                created.add(hydrate(rowInserter.insert(input)));
            } catch (DataIntegrityViolationException ex) {
                rejected.add(new RejectedRow(input, "Row rejected — violates a database constraint."));
            }
        }
        return new BulkResult(created, rejected);
    }

    /**
     * Auto-generate: takes the latest existing period for a
     * market_product_link (or an explicit anchor) and rolls forward N more
     * periods of the same period_type, one calendar step at a time. Only
     * period_types with an unambiguous calendar-label convention are
     * supported (MONTH/QUARTER/HALF_YEAR/YEAR/WEEK/DAY) —
     * SPOT/INTRADAY/SEASON/CROP_YEAR/CUSTOM don't have one, so those are
     * rejected rather than guessed at.
     *
     * Lifecycle dates are resolved from the anchor's market_product_link
     * offset rules (first_notice_day_offset/last_trading_day_offset) where
     * present: last_trade_date = period_end - lastTradingDayOffset days,
     * expiry_date mirrors last_trade_date (the common case),
     * first_notice_date = expiry_date - firstNoticeDayOffset days. This is
     * a simplification — some commodities (e.g. CBOT agri) have first
     * notice BEFORE last trade, which this formula doesn't produce —
     * flagged in docs/period_fx_fold_product_link_pending_07.md as a known
     * gap, not silently assumed correct for every commodity.
     */
    public List<Period> autoGenerate(AutoGenerateRequest request) {
        if (request.iterations() == null || request.iterations() < 1 || request.iterations() > MAX_AUTO_GENERATE_ITERATIONS) {
            throw new ConflictException("Iterations must be between 1 and " + MAX_AUTO_GENERATE_ITERATIONS + ".");
        }
        requireMarketProductLink(request.marketProductLinkId());

        Period anchor = request.anchorPeriodId() != null
                ? repository.findById(request.anchorPeriodId())
                        .orElseThrow(() -> new NotFoundException("No period with id " + request.anchorPeriodId() + "."))
                : repository.findFirstByMarketProductLinkIdOrderByStartDateDescPeriodIdDesc(request.marketProductLinkId())
                        .orElseThrow(() -> new ConflictException(
                                "No existing period found for this market product link to roll forward from — create the first period manually, then auto-generate from there."));

        if (!anchor.getMarketProductLinkId().equals(request.marketProductLinkId())) {
            throw new ConflictException("Anchor period does not belong to the requested market product link.");
        }
        if (anchor.getStartDate() == null || anchor.getEndDate() == null) {
            throw new ConflictException("Anchor period has no concrete dates (period_start/period_end) — auto-generate needs a dated period to roll forward from.");
        }

        MarketProductLink marketProductLink = marketProductLinkRepository.findById(request.marketProductLinkId())
                .orElseThrow(() -> new NotFoundException("No market product link with id " + request.marketProductLinkId() + "."));

        List<Period> generated = new ArrayList<>();
        LocalDate cursorStart = anchor.getStartDate();

        for (int i = 0; i < request.iterations(); i++) {
            PeriodRollCalculator.RolledStep step = PeriodRollCalculator.next(anchor.getPeriodType(), cursorStart);
            Period next = new Period();
            next.setMarketProductLinkId(anchor.getMarketProductLinkId());
            next.setPeriodType(anchor.getPeriodType());
            next.setPeriodCode(step.periodCode());
            next.setPeriodName(step.periodName());
            next.setStartDate(step.periodStart());
            next.setEndDate(step.periodEnd());
            next.setIsRolling(false);
            next.setCurveLabel(step.periodCode());
            next.setLoadTypeLookupId(anchor.getLoadTypeLookupId());
            next.setGasDayTypeLookupId(anchor.getGasDayTypeLookupId());
            next.setPricingCalendarCode(anchor.getPricingCalendarCode());
            next.setSettlementCalendarCode(anchor.getSettlementCalendarCode());
            next.setStatusCode("OPEN");
            next.setIsTradingPeriod(anchor.getIsTradingPeriod());
            next.setIsRiskPeriod(anchor.getIsRiskPeriod());
            next.setIsSettlementPeriod(anchor.getIsSettlementPeriod());
            next.setIsActive(true);

            if (marketProductLink.getLastTradingDayOffset() != null) {
                LocalDate lastTrade = step.periodEnd().minusDays(marketProductLink.getLastTradingDayOffset());
                next.setLastTradeDate(lastTrade);
                next.setExpiryDate(lastTrade);
                if (marketProductLink.getFirstNoticeDayOffset() != null) {
                    next.setFirstNoticeDate(lastTrade.minusDays(marketProductLink.getFirstNoticeDayOffset()));
                }
            }

            if (repository.existsByPeriodCodeIgnoreCaseAndMarketProductLinkId(next.getPeriodCode(), next.getMarketProductLinkId())) {
                throw new ConflictException("Auto-generate stopped — Period Code \"" + next.getPeriodCode()
                        + "\" already exists for this market product link (iteration " + (i + 1) + " of " + request.iterations() + ").");
            }

            generated.add(hydrate(rowInserter.insert(next)));
            cursorStart = step.periodStart();
        }
        return generated;
    }

    public record RejectedRow(Period row, String reason) {}
    public record BulkResult(List<Period> created, List<RejectedRow> rejected) {}
    public record AutoGenerateRequest(Integer marketProductLinkId, Long anchorPeriodId, Integer iterations) {}
}
