package com.etrm.system.emissionobligation;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.emissionscheme.EmissionSchemeRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EmissionObligationService {

    private final EmissionObligationRepository repository;
    private final EmissionObligationStatusRepository statusRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final EmissionSchemeRepository schemeRepository;

    public EmissionObligationService(EmissionObligationRepository repository,
                                      EmissionObligationStatusRepository statusRepository,
                                      LegalEntityRepository legalEntityRepository,
                                      EmissionSchemeRepository schemeRepository) {
        this.repository = repository;
        this.statusRepository = statusRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.schemeRepository = schemeRepository;
    }

    private void resolveForeignKeys(EmissionObligation input) {
        if (input.getStatusCode() != null) {
            EmissionObligationStatus status = statusRepository.findByTypeCodeIgnoreCase(input.getStatusCode())
                    .orElseThrow(() -> new NotFoundException("No emission obligation status \"" + input.getStatusCode() + "\"."));
            input.setStatus(status.getEmissionObligationStatusId());
        }
    }

    private EmissionObligation hydrate(EmissionObligation obligation) {
        statusRepository.findById(obligation.getStatus())
                .ifPresent(s -> obligation.setStatusCode(s.getTypeCode()));
        legalEntityRepository.findById(obligation.getLegalEntityId())
                .ifPresent(e -> obligation.setEntityName(e.getEntityName()));
        schemeRepository.findById(obligation.getSchemeId())
                .ifPresent(s -> obligation.setSchemeName(s.getSchemeName()));
        return obligation;
    }

    @Transactional(readOnly = true)
    public List<EmissionObligation> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public EmissionObligation create(EmissionObligation input) {
        resolveForeignKeys(input);
        input.setObligationId(null);
        return hydrate(repository.save(input));
    }

    public EmissionObligation update(Integer id, EmissionObligation input) {
        EmissionObligation existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No emission obligation with id " + id + "."));
        resolveForeignKeys(input);
        input.setObligationId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
