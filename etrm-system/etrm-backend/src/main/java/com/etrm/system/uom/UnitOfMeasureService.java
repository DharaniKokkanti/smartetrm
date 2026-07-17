package com.etrm.system.uom;

import com.etrm.system.commodity.CommodityRepository;
import com.etrm.system.commodity.CommodityTypeMapping;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class UnitOfMeasureService {

    private final UnitOfMeasureRepository repository;
    private final UomTypeRepository uomTypeRepository;
    private final CommodityRepository commodityRepository;

    public UnitOfMeasureService(UnitOfMeasureRepository repository, UomTypeRepository uomTypeRepository,
                                 CommodityRepository commodityRepository) {
        this.repository = repository;
        this.uomTypeRepository = uomTypeRepository;
        this.commodityRepository = commodityRepository;
    }

    private UnitOfMeasure hydrate(UnitOfMeasure uom) {
        uomTypeRepository.findById(uom.getUomTypeId()).ifPresent(t -> uom.setUomTypeCode(t.getTypeCode()));
        if (uom.getCommodityTypeId() != null) {
            commodityRepository.findById(uom.getCommodityTypeId())
                    .ifPresent(c -> uom.setCommodityTypeCode(CommodityTypeMapping.codeToType(c.getCommodityCode())));
        }
        return uom;
    }

    @Transactional(readOnly = true)
    public List<UnitOfMeasure> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public UnitOfMeasure create(UnitOfMeasure input) {
        input.setUomId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public UnitOfMeasure update(Integer id, UnitOfMeasure input) {
        UnitOfMeasure existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No unit of measure with id " + id + "."));
        input.setUomId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        UnitOfMeasure existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No unit of measure with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
