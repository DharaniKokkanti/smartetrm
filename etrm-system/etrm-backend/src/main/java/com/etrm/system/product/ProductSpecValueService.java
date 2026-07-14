package com.etrm.system.product;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductSpecValueService {

    private final ProductSpecValueRepository repository;
    private final SpecParameterRepository parameterRepository;
    private final UnitOfMeasureRepository uomRepository;

    public ProductSpecValueService(ProductSpecValueRepository repository, SpecParameterRepository parameterRepository,
                                    UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.parameterRepository = parameterRepository;
        this.uomRepository = uomRepository;
    }

    private ProductSpecValue hydrate(ProductSpecValue value) {
        parameterRepository.findById(value.getParameterId()).ifPresent(p -> {
            value.setParameterCode(p.getParameterCode());
            value.setParameterName(p.getParameterName());
            value.setParameterCategory(p.getParameterCategory());
        });
        if (value.getUomId() != null) {
            uomRepository.findById(value.getUomId()).ifPresent(u -> value.setUomCode(u.getUomCode()));
        }
        return value;
    }

    @Transactional(readOnly = true)
    public List<ProductSpecValue> list(Integer templateId) {
        return repository.findByTemplateId(templateId).stream().map(this::hydrate).toList();
    }

    public ProductSpecValue create(Integer templateId, ProductSpecValue input) {
        input.setSpecValueId(null);
        input.setTemplateId(templateId);
        return hydrate(repository.save(input));
    }

    public ProductSpecValue update(Integer templateId, Integer specValueId, ProductSpecValue input) {
        if (!repository.existsById(specValueId)) {
            throw new NotFoundException("No spec value with id " + specValueId + ".");
        }
        input.setSpecValueId(specValueId);
        input.setTemplateId(templateId);
        return hydrate(repository.save(input));
    }

    public void delete(Integer specValueId) {
        if (!repository.existsById(specValueId)) {
            throw new NotFoundException("No spec value with id " + specValueId + ".");
        }
        repository.deleteById(specValueId);
    }
}
