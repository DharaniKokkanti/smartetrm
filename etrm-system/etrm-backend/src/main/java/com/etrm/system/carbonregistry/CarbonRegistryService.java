package com.etrm.system.carbonregistry;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CarbonRegistryService {

    private final CarbonRegistryRepository repository;
    private final CarbonRegistryTypeRepository typeRepository;

    public CarbonRegistryService(CarbonRegistryRepository repository, CarbonRegistryTypeRepository typeRepository) {
        this.repository = repository;
        this.typeRepository = typeRepository;
    }

    private void resolveForeignKeys(CarbonRegistry input) {
        if (input.getRegistryTypeCode() != null) {
            CarbonRegistryType type = typeRepository.findByTypeCodeIgnoreCase(input.getRegistryTypeCode())
                    .orElseThrow(() -> new NotFoundException("No carbon registry type \"" + input.getRegistryTypeCode() + "\"."));
            input.setRegistryType(type.getCarbonRegistryTypeId());
        }
    }

    private CarbonRegistry hydrate(CarbonRegistry registry) {
        typeRepository.findById(registry.getRegistryType())
                .ifPresent(t -> registry.setRegistryTypeCode(t.getTypeCode()));
        return registry;
    }

    @Transactional(readOnly = true)
    public List<CarbonRegistry> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public CarbonRegistry create(CarbonRegistry input) {
        resolveForeignKeys(input);
        input.setRegistryId(null);
        return hydrate(repository.save(input));
    }

    public CarbonRegistry update(Integer id, CarbonRegistry input) {
        CarbonRegistry existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No carbon registry with id " + id + "."));
        resolveForeignKeys(input);
        input.setRegistryId(id);
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
        CarbonRegistry existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No carbon registry with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
