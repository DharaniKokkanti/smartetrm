package com.etrm.system.uomconversion;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.uom.UnitOfMeasure;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UomConversionService {

    private final UomConversionRepository repository;
    private final UnitOfMeasureRepository uomRepository;

    public UomConversionService(UomConversionRepository repository, UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.uomRepository = uomRepository;
    }

    private UnitOfMeasure findUomByCode(String uomCode) {
        return uomRepository.findAll().stream()
                .filter(u -> u.getUomCode().equalsIgnoreCase(uomCode))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No unit of measure with code \"" + uomCode + "\"."));
    }

    private UomConversion hydrate(UomConversion conversion) {
        uomRepository.findById(conversion.getFromUomId())
                .ifPresent(u -> conversion.setFromUomCode(u.getUomCode()));
        uomRepository.findById(conversion.getToUomId())
                .ifPresent(u -> conversion.setToUomCode(u.getUomCode()));
        return conversion;
    }

    private void resolveUomIds(UomConversion input) {
        input.setFromUomId(findUomByCode(input.getFromUomCode()).getUomId());
        input.setToUomId(findUomByCode(input.getToUomCode()).getUomId());
    }

    @Transactional(readOnly = true)
    public List<UomConversion> list(String commodityType) {
        List<UomConversion> all = repository.findAll().stream().map(this::hydrate).toList();
        if (commodityType == null || commodityType.isBlank()) {
            return all;
        }
        return all.stream()
                .filter(c -> commodityType.equalsIgnoreCase(c.getCommodityType()))
                .toList();
    }

    public UomConversion create(UomConversion input) {
        input.setConversionId(null);
        resolveUomIds(input);
        return hydrate(repository.save(input));
    }

    public UomConversion update(Integer id, UomConversion input) {
        UomConversion existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No UOM conversion with id " + id + "."));
        input.setConversionId(id);
        // V151 — created_at/created_by are @CreatedDate/@CreatedBy — JPA
        // auditing only populates those on insert, so the request body never
        // carries them; without copying them from the existing row here,
        // updatable=false keeps the DB value untouched but the response
        // would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        resolveUomIds(input);
        return hydrate(repository.save(input));
    }

    public void delete(Integer id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("No UOM conversion with id " + id + ".");
        }
        repository.deleteById(id);
    }
}
