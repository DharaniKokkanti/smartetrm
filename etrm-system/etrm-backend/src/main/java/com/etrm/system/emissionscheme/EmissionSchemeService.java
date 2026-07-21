package com.etrm.system.emissionscheme;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return hydrate(repository.save(input));
    }

    public EmissionScheme update(Integer id, EmissionScheme input) {
        EmissionScheme existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No emission scheme with id " + id + "."));
        resolveForeignKeys(input);
        input.setSchemeId(id);
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
        EmissionScheme existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No emission scheme with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
