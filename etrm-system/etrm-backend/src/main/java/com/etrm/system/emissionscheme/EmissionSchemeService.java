package com.etrm.system.emissionscheme;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class EmissionSchemeService {

    private final EmissionSchemeRepository repository;
    private final EmissionSchemeTypeRepository typeRepository;

    public EmissionSchemeService(EmissionSchemeRepository repository, EmissionSchemeTypeRepository typeRepository) {
        this.repository = repository;
        this.typeRepository = typeRepository;
    }

    private void resolveForeignKeys(EmissionScheme input) {
        if (input.getSchemeTypeCode() != null) {
            EmissionSchemeType type = typeRepository.findByTypeCodeIgnoreCase(input.getSchemeTypeCode())
                    .orElseThrow(() -> new NotFoundException("No emission scheme type \"" + input.getSchemeTypeCode() + "\"."));
            input.setSchemeType(type.getEmissionSchemeTypeId());
        }
    }

    private EmissionScheme hydrate(EmissionScheme scheme) {
        typeRepository.findById(scheme.getSchemeType())
                .ifPresent(t -> scheme.setSchemeTypeCode(t.getTypeCode()));
        return scheme;
    }

    @Transactional(readOnly = true)
    public List<EmissionScheme> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public EmissionScheme create(EmissionScheme input) {
        resolveForeignKeys(input);
        input.setSchemeId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public EmissionScheme update(Integer id, EmissionScheme input) {
        EmissionScheme existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No emission scheme with id " + id + "."));
        resolveForeignKeys(input);
        input.setSchemeId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        EmissionScheme existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No emission scheme with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
