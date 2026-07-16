package com.etrm.system.vessel;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.country.CountryRepository;
import com.etrm.system.transportoperator.TransportOperatorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VesselService {

    private final VesselRepository repository;
    private final TransportOperatorRepository operatorRepository;
    private final CountryRepository countryRepository;
    private final FleetRepository fleetRepository;

    public VesselService(VesselRepository repository, TransportOperatorRepository operatorRepository,
                          CountryRepository countryRepository, FleetRepository fleetRepository) {
        this.repository = repository;
        this.operatorRepository = operatorRepository;
        this.countryRepository = countryRepository;
        this.fleetRepository = fleetRepository;
    }

    private Vessel hydrate(Vessel vessel) {
        if (vessel.getOwnerOperatorId() != null) {
            operatorRepository.findById(vessel.getOwnerOperatorId())
                    .ifPresent(o -> vessel.setOwnerOperatorName(o.getOperatorName()));
        }
        if (vessel.getManagerOperatorId() != null) {
            operatorRepository.findById(vessel.getManagerOperatorId())
                    .ifPresent(o -> vessel.setManagerOperatorName(o.getOperatorName()));
        }
        countryRepository.findById(vessel.getFlagCountryId())
                .ifPresent(c -> vessel.setFlagCountryCode(c.getCountryCode()));
        if (vessel.getBuildCountryId() != null) {
            countryRepository.findById(vessel.getBuildCountryId())
                    .ifPresent(c -> vessel.setBuildCountryCode(c.getCountryCode()));
        }
        if (vessel.getFleetId() != null) {
            fleetRepository.findById(vessel.getFleetId()).ifPresent(f -> vessel.setFleetName(f.getFleetName()));
        }
        return vessel;
    }

    @Transactional(readOnly = true)
    public List<Vessel> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Vessel create(Vessel input) {
        if (repository.existsByImoNumberIgnoreCase(input.getImoNumber())) {
            throw new ConflictException("IMO Number \"" + input.getImoNumber() + "\" already exists.");
        }
        input.setVesselId(null);
        return hydrate(repository.save(input));
    }

    public Vessel update(Integer id, Vessel input) {
        Vessel existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No vessel with id " + id + "."));
        input.setVesselId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Vessel existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No vessel with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
