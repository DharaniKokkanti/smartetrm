package com.etrm.system.period;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.lookup.CommodityTypeRepository;
import com.etrm.system.lookup.LookupResolutionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PeriodService {

    private static final String LOAD_TYPE_CATEGORY = "load_type";
    private static final String GAS_DAY_TYPE_CATEGORY = "gas_day_type";

    private final PeriodRepository repository;
    private final CommodityTypeRepository commodityTypeRepository;
    private final LookupResolutionService lookupResolutionService;

    public PeriodService(PeriodRepository repository, CommodityTypeRepository commodityTypeRepository,
                          LookupResolutionService lookupResolutionService) {
        this.repository = repository;
        this.commodityTypeRepository = commodityTypeRepository;
        this.lookupResolutionService = lookupResolutionService;
    }

    private Period hydrate(Period period) {
        if (period.getCommodityTypeId() != null) {
            commodityTypeRepository.findById(period.getCommodityTypeId())
                    .ifPresent(c -> period.setCommodityType(c.getTypeCode()));
        }
        if (period.getLoadTypeLookupId() != null) {
            period.setLoadType(lookupResolutionService.codeForId(LOAD_TYPE_CATEGORY, period.getLoadTypeLookupId()));
        }
        if (period.getGasDayTypeLookupId() != null) {
            period.setGasDayType(lookupResolutionService.codeForId(GAS_DAY_TYPE_CATEGORY, period.getGasDayTypeLookupId()));
        }
        return period;
    }

    /** Resolves the frontend's string codes back to the FK ids the DB actually stores. */
    private void resolveForeignKeys(Period input) {
        input.setCommodityTypeId(input.getCommodityType() == null ? null
                : commodityTypeRepository.findByTypeCodeIgnoreCase(input.getCommodityType())
                        .orElseThrow(() -> new NotFoundException("No commodity type \"" + input.getCommodityType() + "\"."))
                        .getCommodityTypeId());
        input.setLoadTypeLookupId(input.getLoadType() == null ? null
                : lookupResolutionService.idForCode(LOAD_TYPE_CATEGORY, input.getLoadType()));
        input.setGasDayTypeLookupId(input.getGasDayType() == null ? null
                : lookupResolutionService.idForCode(GAS_DAY_TYPE_CATEGORY, input.getGasDayType()));
    }

    @Transactional(readOnly = true)
    public List<Period> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public Period get(Integer id) {
        return hydrate(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No period with id " + id + ".")));
    }

    private void normalizeCodeField(Period input) {
        if (input.getPeriodCode() != null) input.setPeriodCode(input.getPeriodCode().toUpperCase());
    }

    public Period create(Period input) {
        normalizeCodeField(input);
        if (repository.existsByPeriodCodeIgnoreCase(input.getPeriodCode())) {
            throw new ConflictException("Period Code \"" + input.getPeriodCode() + "\" already exists.");
        }
        resolveForeignKeys(input);
        input.setPeriodId(null);
        return hydrate(repository.save(input));
    }

    public Period update(Integer id, Period input) {
        Period existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No period with id " + id + "."));
        normalizeCodeField(input);
        resolveForeignKeys(input);
        input.setPeriodId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing only
        // populates those on insert (deliberately, so a later update never
        // overwrites who originally created the row), so the request body never
        // carries them. Without copying them from the existing row, the DB value
        // is untouched (updatable = false) but the response the client actually
        // sees would show them as null — as if the record's provenance vanished.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Period existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No period with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
