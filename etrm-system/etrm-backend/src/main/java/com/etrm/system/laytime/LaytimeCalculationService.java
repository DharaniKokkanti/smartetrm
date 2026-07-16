package com.etrm.system.laytime;

import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.location.LocationRepository;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class LaytimeCalculationService {

    private final LaytimeCalculationRepository repository;
    private final LocationRepository locationRepository;
    private final LaytimeTermTemplateRepository laytimeTermTemplateRepository;
    private final CurrencyRepository currencyRepository;
    private final AuditorAware<String> auditorAware;

    public LaytimeCalculationService(LaytimeCalculationRepository repository, LocationRepository locationRepository,
                                      LaytimeTermTemplateRepository laytimeTermTemplateRepository,
                                      CurrencyRepository currencyRepository, AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.locationRepository = locationRepository;
        this.laytimeTermTemplateRepository = laytimeTermTemplateRepository;
        this.currencyRepository = currencyRepository;
        this.auditorAware = auditorAware;
    }

    private LaytimeCalculation hydrate(LaytimeCalculation calc) {
        locationRepository.findById(calc.getPortLocationId()).ifPresent(l -> calc.setPortLocationName(l.getLocationName()));
        if (calc.getLaytimeTermId() != null) {
            laytimeTermTemplateRepository.findById(calc.getLaytimeTermId()).ifPresent(t -> calc.setLaytimeTermCode(t.getTermCode()));
        }
        if (calc.getCurrencyId() != null) {
            currencyRepository.findById(calc.getCurrencyId()).ifPresent(c -> calc.setCurrencyCode(c.getCurrencyCode()));
        }
        return calc;
    }

    @Transactional(readOnly = true)
    public List<LaytimeCalculation> list(Integer voyageId) {
        List<LaytimeCalculation> results = voyageId != null
                ? repository.findByVoyageIdOrderByPortLocationIdAscVersionNumberAsc(voyageId)
                : repository.findAll();
        return results.stream().map(this::hydrate).toList();
    }

    // Always inserts a new version — never updates a prior calculation's figures in place.
    // If a current version already exists for this voyage+port, it is flipped off and linked
    // via superseded_by_version once the new row's id is known.
    public LaytimeCalculation create(LaytimeCalculation input) {
        LaytimeCalculation priorCurrent = repository
                .findByVoyageIdAndPortLocationIdAndIsCurrentVersionTrue(input.getVoyageId(), input.getPortLocationId())
                .orElse(null);

        input.setLaytimeCalculationId(null);
        input.setVersionNumber(priorCurrent != null ? priorCurrent.getVersionNumber() + 1 : 1);
        input.setIsCurrentVersion(true);
        input.setSupersededByVersion(null);
        input.setCalculatedAt(input.getCalculatedAt() != null ? input.getCalculatedAt() : LocalDateTime.now());
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        LaytimeCalculation saved = repository.save(input);

        if (priorCurrent != null) {
            priorCurrent.setIsCurrentVersion(false);
            priorCurrent.setSupersededByVersion(saved.getVersionNumber());
            repository.save(priorCurrent);
        }
        return hydrate(saved);
    }
}
