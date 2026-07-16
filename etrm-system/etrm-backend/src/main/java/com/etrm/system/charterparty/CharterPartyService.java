package com.etrm.system.charterparty;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.laytime.LaytimeTermTemplateRepository;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.vessel.VesselRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CharterPartyService {

    private final CharterPartyRepository repository;
    private final CharterPartyTypeRepository charterPartyTypeRepository;
    private final VesselRepository vesselRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final CurrencyRepository currencyRepository;
    private final LaytimeTermTemplateRepository laytimeTermTemplateRepository;
    private final LocationRepository locationRepository;
    private final CharterPartyTemplateRepository charterPartyTemplateRepository;

    public CharterPartyService(CharterPartyRepository repository, CharterPartyTypeRepository charterPartyTypeRepository,
                                VesselRepository vesselRepository, CounterpartyRepository counterpartyRepository,
                                CurrencyRepository currencyRepository, LaytimeTermTemplateRepository laytimeTermTemplateRepository,
                                LocationRepository locationRepository, CharterPartyTemplateRepository charterPartyTemplateRepository) {
        this.repository = repository;
        this.charterPartyTypeRepository = charterPartyTypeRepository;
        this.vesselRepository = vesselRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.currencyRepository = currencyRepository;
        this.laytimeTermTemplateRepository = laytimeTermTemplateRepository;
        this.locationRepository = locationRepository;
        this.charterPartyTemplateRepository = charterPartyTemplateRepository;
    }

    private CharterParty hydrate(CharterParty cp) {
        charterPartyTypeRepository.findById(cp.getCharterPartyTypeId()).ifPresent(t -> cp.setCharterPartyTypeCode(t.getTypeCode()));
        vesselRepository.findById(cp.getVesselId()).ifPresent(v -> cp.setVesselName(v.getVesselName()));
        counterpartyRepository.findById(cp.getCounterpartyId()).ifPresent(c -> cp.setCounterpartyName(c.getLegalName()));
        if (cp.getHireCurrencyId() != null) {
            currencyRepository.findById(cp.getHireCurrencyId()).ifPresent(c -> cp.setHireCurrencyCode(c.getCurrencyCode()));
        }
        if (cp.getLaytimeTermId() != null) {
            laytimeTermTemplateRepository.findById(cp.getLaytimeTermId()).ifPresent(t -> cp.setLaytimeTermCode(t.getTermCode()));
        }
        if (cp.getDeliveryLocationId() != null) {
            locationRepository.findById(cp.getDeliveryLocationId()).ifPresent(l -> cp.setDeliveryLocationName(l.getLocationName()));
        }
        if (cp.getRedeliveryLocationId() != null) {
            locationRepository.findById(cp.getRedeliveryLocationId()).ifPresent(l -> cp.setRedeliveryLocationName(l.getLocationName()));
        }
        if (cp.getCharterPartyTemplateId() != null) {
            charterPartyTemplateRepository.findById(cp.getCharterPartyTemplateId()).ifPresent(t -> cp.setCharterPartyTemplateCode(t.getTemplateCode()));
        }
        return cp;
    }

    @Transactional(readOnly = true)
    public List<CharterParty> list(Integer vesselId, Integer counterpartyId) {
        List<CharterParty> results;
        if (vesselId != null) {
            results = repository.findByVesselId(vesselId);
        } else if (counterpartyId != null) {
            results = repository.findByCounterpartyId(counterpartyId);
        } else {
            results = repository.findAll();
        }
        return results.stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public CharterParty get(Integer id) {
        return hydrate(repository.findById(id).orElseThrow(() -> new NotFoundException("No charter party with id " + id + ".")));
    }

    public CharterParty create(CharterParty input) {
        input.setCharterPartyId(null);
        return hydrate(repository.save(input));
    }

    public CharterParty update(Integer id, CharterParty input) {
        CharterParty existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No charter party with id " + id + "."));
        input.setCharterPartyId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        CharterParty existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No charter party with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
