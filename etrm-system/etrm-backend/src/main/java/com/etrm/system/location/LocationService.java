package com.etrm.system.location;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class LocationService {

    private final LocationRepository repository;
    private final LocationTypeRepository locationTypeRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final AuditorAware<String> auditorAware;

    public LocationService(LocationRepository repository, LocationTypeRepository locationTypeRepository,
                            UnitOfMeasureRepository uomRepository, AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.locationTypeRepository = locationTypeRepository;
        this.uomRepository = uomRepository;
        this.auditorAware = auditorAware;
    }

    private Location hydrate(Location location) {
        locationTypeRepository.findById(location.getLocationTypeId())
                .ifPresent(t -> location.setLocationTypeCode(t.getTypeCode()));
        if (location.getCapacityUomId() != null) {
            uomRepository.findById(location.getCapacityUomId()).ifPresent(u -> location.setCapacityUomCode(u.getUomCode()));
        }
        return location;
    }

    private void resolveForeignKeys(Location input) {
        if (input.getLocationTypeCode() != null) {
            LocationType type = locationTypeRepository.findByTypeCodeIgnoreCase(input.getLocationTypeCode())
                    .orElseThrow(() -> new NotFoundException("No location type \"" + input.getLocationTypeCode() + "\"."));
            input.setLocationTypeId(type.getLocationTypeId());
        }
    }

    private void normalizeCodeField(Location input) {
        if (input.getLocationCode() != null) input.setLocationCode(input.getLocationCode().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<Location> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Location create(Location input) {
        normalizeCodeField(input);
        if (repository.existsByLocationCodeIgnoreCase(input.getLocationCode())) {
            throw new ConflictException("Location Code \"" + input.getLocationCode() + "\" already exists.");
        }
        resolveForeignKeys(input);
        input.setLocationId(null);
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        return hydrate(repository.save(input));
    }

    public Location update(Integer id, Location input) {
        Location existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No location with id " + id + "."));
        normalizeCodeField(input);
        resolveForeignKeys(input);
        input.setLocationId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Location existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No location with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
