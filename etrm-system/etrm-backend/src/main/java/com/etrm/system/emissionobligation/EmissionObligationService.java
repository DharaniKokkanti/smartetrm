package com.etrm.system.emissionobligation;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.emissionscheme.EmissionSchemeRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public EmissionObligation update(Integer id, EmissionObligation input) {
        EmissionObligation existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No emission obligation with id " + id + "."));
        resolveForeignKeys(input);
        input.setObligationId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }
}
