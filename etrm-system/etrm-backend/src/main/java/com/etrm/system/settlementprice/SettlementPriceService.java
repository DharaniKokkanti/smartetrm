package com.etrm.system.settlementprice;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.period.PeriodRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class SettlementPriceService {

    private final SettlementPriceRepository repository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final PeriodRepository periodRepository;

    public SettlementPriceService(SettlementPriceRepository repository,
                                   UnitOfMeasureRepository unitOfMeasureRepository,
                                   PeriodRepository periodRepository) {
        this.repository = repository;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.periodRepository = periodRepository;
    }

    private SettlementPrice hydrate(SettlementPrice price) {
        unitOfMeasureRepository.findById(price.getUomId())
                .ifPresent(uom -> price.setUomCode(uom.getUomCode()));
        if (price.getPeriodId() != null) {
            periodRepository.findById(price.getPeriodId())
                    .ifPresent(p -> price.setPeriodCode(p.getPeriodCode()));
        }
        return price;
    }

    @Transactional(readOnly = true)
    public List<SettlementPrice> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public SettlementPrice create(SettlementPrice input) {
        input.setSettlementPriceId(null);
        return hydrate(repository.save(input));
    }

    // Numeric equality, not .equals() — BigDecimal.equals() treats different
    // scales (72.45 vs 72.450000) as unequal, which would false-positive here.
    private boolean sameValue(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return a == b;
        return a.compareTo(b) == 0;
    }

    public SettlementPrice update(Integer id, SettlementPrice input) {
        SettlementPrice existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No settlement price with id " + id + "."));
        if (sameValue(existing.getOpenPrice(), input.getOpenPrice())
                && sameValue(existing.getHighPrice(), input.getHighPrice())
                && sameValue(existing.getLowPrice(), input.getLowPrice())
                && sameValue(existing.getAvgPrice(), input.getAvgPrice())) {
            throw new ConflictException("At least one of Open/High/Low/Avg price must change to save this update.");
        }
        input.setSettlementPriceId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public SettlementPrice confirm(Integer id) {
        SettlementPrice existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No settlement price with id " + id + "."));
        existing.setIsConfirmed(true);
        return hydrate(repository.save(existing));
    }
}
