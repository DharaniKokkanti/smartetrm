package com.etrm.system.environmentalproduct;

import com.etrm.system.carbonregistry.CarbonRegistryRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.emissionscheme.EmissionSchemeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EnvironmentalProductService {

    private final EnvironmentalProductRepository repository;
    private final EnvironmentalProductTypeRepository typeRepository;
    private final EmissionSchemeRepository schemeRepository;
    private final CarbonRegistryRepository registryRepository;

    public EnvironmentalProductService(EnvironmentalProductRepository repository,
                                        EnvironmentalProductTypeRepository typeRepository,
                                        EmissionSchemeRepository schemeRepository,
                                        CarbonRegistryRepository registryRepository) {
        this.repository = repository;
        this.typeRepository = typeRepository;
        this.schemeRepository = schemeRepository;
        this.registryRepository = registryRepository;
    }

    private void resolveForeignKeys(EnvironmentalProduct input) {
        if (input.getProductTypeCode() != null) {
            EnvironmentalProductType type = typeRepository.findByTypeCodeIgnoreCase(input.getProductTypeCode())
                    .orElseThrow(() -> new NotFoundException("No environmental product type \"" + input.getProductTypeCode() + "\"."));
            input.setProductType(type.getEnvironmentalProductTypeId());
        }
    }

    private EnvironmentalProduct hydrate(EnvironmentalProduct product) {
        typeRepository.findById(product.getProductType())
                .ifPresent(t -> product.setProductTypeCode(t.getTypeCode()));
        if (product.getSchemeId() != null) {
            schemeRepository.findById(product.getSchemeId())
                    .ifPresent(s -> product.setSchemeName(s.getSchemeName()));
        }
        if (product.getRegistryId() != null) {
            registryRepository.findById(product.getRegistryId())
                    .ifPresent(r -> product.setRegistryName(r.getRegistryName()));
        }
        return product;
    }

    @Transactional(readOnly = true)
    public List<EnvironmentalProduct> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public EnvironmentalProduct create(EnvironmentalProduct input) {
        resolveForeignKeys(input);
        input.setProductId(null);
        return hydrate(repository.save(input));
    }

    public EnvironmentalProduct update(Integer id, EnvironmentalProduct input) {
        EnvironmentalProduct existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No environmental product with id " + id + "."));
        resolveForeignKeys(input);
        input.setProductId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        EnvironmentalProduct existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No environmental product with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
