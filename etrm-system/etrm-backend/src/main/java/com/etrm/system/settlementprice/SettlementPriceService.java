package com.etrm.system.settlementprice;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SettlementPriceService {

    private final SettlementPriceRepository repository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;

    public SettlementPriceService(SettlementPriceRepository repository,
                                   UnitOfMeasureRepository unitOfMeasureRepository) {
        this.repository = repository;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
    }

    private SettlementPrice hydrate(SettlementPrice price) {
        unitOfMeasureRepository.findById(price.getUomId())
                .ifPresent(uom -> price.setUomCode(uom.getUomCode()));
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

    public SettlementPrice update(Integer id, SettlementPrice input) {
        SettlementPrice existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No settlement price with id " + id + "."));
        input.setSettlementPriceId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return hydrate(repository.save(input));
    }

    public SettlementPrice confirm(Integer id) {
        SettlementPrice existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No settlement price with id " + id + "."));
        existing.setIsConfirmed(true);
        return hydrate(repository.save(existing));
    }
}
