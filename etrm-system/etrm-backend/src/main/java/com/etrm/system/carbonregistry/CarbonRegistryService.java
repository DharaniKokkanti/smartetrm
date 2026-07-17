package com.etrm.system.carbonregistry;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public CarbonRegistry update(Integer id, CarbonRegistry input) {
        CarbonRegistry existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No carbon registry with id " + id + "."));
        resolveForeignKeys(input);
        input.setRegistryId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        CarbonRegistry existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No carbon registry with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
