package com.etrm.system.rinobligation;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.lookup.LookupResolutionService;
import com.etrm.system.rinfuelcategory.RinFuelCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RinObligationService {

    private static final String STATUS_CATEGORY = "RIN_OBLIGATION_STATUS";

    private final RinObligationRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final RinFuelCategoryRepository fuelCategoryRepository;
    private final LookupResolutionService lookupResolutionService;

    public RinObligationService(RinObligationRepository repository, LegalEntityRepository legalEntityRepository,
                                 RinFuelCategoryRepository fuelCategoryRepository,
                                 LookupResolutionService lookupResolutionService) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.fuelCategoryRepository = fuelCategoryRepository;
        this.lookupResolutionService = lookupResolutionService;
    }

    private void resolveForeignKeys(RinObligation input) {
        if (input.getStatusCode() != null) {
            input.setStatus(lookupResolutionService.idForCode(STATUS_CATEGORY, input.getStatusCode()));
        }
    }

    private RinObligation hydrate(RinObligation obligation) {
        obligation.setStatusCode(lookupResolutionService.codeForId(STATUS_CATEGORY, obligation.getStatus()));
        legalEntityRepository.findById(obligation.getLegalEntityId())
                .ifPresent(e -> obligation.setEntityName(e.getEntityName()));
        fuelCategoryRepository.findByDCodeIgnoreCase(obligation.getDCode())
                .ifPresent(f -> obligation.setFuelName(f.getFuelName()));
        return obligation;
    }

    @Transactional(readOnly = true)
    public List<RinObligation> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public RinObligation create(RinObligation input) {
        resolveForeignKeys(input);
        input.setObligationId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public RinObligation update(Integer id, RinObligation input) {
        RinObligation existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No RIN obligation with id " + id + "."));
        resolveForeignKeys(input);
        input.setObligationId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }
}
