package com.etrm.system.uom;

import com.etrm.system.commodity.CommodityRepository;
import com.etrm.system.commodity.CommodityTypeMapping;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return hydrate(repository.save(input));
    }

    public UnitOfMeasure update(Integer id, UnitOfMeasure input) {
        UnitOfMeasure existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No unit of measure with id " + id + "."));
        input.setUomId(id);
        // V151 — created_at/created_by are @CreatedDate/@CreatedBy — JPA
        // auditing only populates those on insert, so the request body never
        // carries them; without copying them from the existing row here,
        // updatable=false keeps the DB value untouched but the response
        // would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        UnitOfMeasure existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No unit of measure with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
