package com.etrm.system.regulatoryobligation;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RegulatoryObligationService {

    private final RegulatoryObligationRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final RegulatoryReportTypeRepository reportTypeRepository;

    public RegulatoryObligationService(RegulatoryObligationRepository repository,
                                        LegalEntityRepository legalEntityRepository,
                                        RegulatoryReportTypeRepository reportTypeRepository) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.reportTypeRepository = reportTypeRepository;
    }

    private RegulatoryObligation hydrate(RegulatoryObligation o) {
        legalEntityRepository.findById(o.getLegalEntityId()).ifPresent(e -> o.setLegalEntityName(e.getEntityName()));
        reportTypeRepository.findById(o.getReportTypeId()).ifPresent(t -> o.setReportTypeName(t.getReportName()));
        if (o.getReportingEntityId() != null) {
            legalEntityRepository.findById(o.getReportingEntityId()).ifPresent(e -> o.setReportingEntityName(e.getEntityName()));
        }
        return o;
    }

    @Transactional(readOnly = true)
    public List<RegulatoryObligation> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public RegulatoryObligation create(RegulatoryObligation input) {
        input.setObligationId(null);
        return hydrate(repository.save(input));
    }

    public RegulatoryObligation update(Integer id, RegulatoryObligation input) {
        RegulatoryObligation existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No regulatory obligation with id " + id + "."));
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

    public void deactivate(Integer id) {
        RegulatoryObligation existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No regulatory obligation with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
