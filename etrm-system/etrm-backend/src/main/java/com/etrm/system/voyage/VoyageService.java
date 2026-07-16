package com.etrm.system.voyage;

import com.etrm.system.charterparty.CharterPartyRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.vessel.VesselRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VoyageService {

    private final VoyageRepository repository;
    private final VesselRepository vesselRepository;
    private final CharterPartyRepository charterPartyRepository;
    private final LocationRepository locationRepository;

    public VoyageService(VoyageRepository repository, VesselRepository vesselRepository,
                          CharterPartyRepository charterPartyRepository, LocationRepository locationRepository) {
        this.repository = repository;
        this.vesselRepository = vesselRepository;
        this.charterPartyRepository = charterPartyRepository;
        this.locationRepository = locationRepository;
    }

    private Voyage hydrate(Voyage voyage) {
        vesselRepository.findById(voyage.getVesselId()).ifPresent(v -> voyage.setVesselName(v.getVesselName()));
        if (voyage.getCharterPartyId() != null) {
            charterPartyRepository.findById(voyage.getCharterPartyId()).ifPresent(cp -> voyage.setCpReference(cp.getCpReference()));
        }
        if (voyage.getLoadLocationId() != null) {
            locationRepository.findById(voyage.getLoadLocationId()).ifPresent(l -> voyage.setLoadLocationName(l.getLocationName()));
        }
        if (voyage.getDischargeLocationId() != null) {
            locationRepository.findById(voyage.getDischargeLocationId()).ifPresent(l -> voyage.setDischargeLocationName(l.getLocationName()));
        }
        return voyage;
    }

    @Transactional(readOnly = true)
    public List<Voyage> list(Integer vesselId, Integer charterPartyId) {
        List<Voyage> results;
        if (vesselId != null) {
            results = repository.findByVesselId(vesselId);
        } else if (charterPartyId != null) {
            results = repository.findByCharterPartyId(charterPartyId);
        } else {
            results = repository.findAll();
        }
        return results.stream().map(this::hydrate).toList();
    }

    @Transactional(readOnly = true)
    public Voyage get(Integer id) {
        return hydrate(repository.findById(id).orElseThrow(() -> new NotFoundException("No voyage with id " + id + ".")));
    }

    public Voyage create(Voyage input) {
        input.setVoyageId(null);
        return hydrate(repository.save(input));
    }

    public Voyage update(Integer id, Voyage input) {
        Voyage existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No voyage with id " + id + "."));
        input.setVoyageId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Voyage existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No voyage with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
