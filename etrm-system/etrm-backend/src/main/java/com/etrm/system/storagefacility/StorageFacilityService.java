package com.etrm.system.storagefacility;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.country.CountryRepository;
import com.etrm.system.location.Location;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StorageFacilityService {

    private final StorageFacilityRepository repository;
    private final LocationRepository locationRepository;
    private final CountryRepository countryRepository;
    private final UnitOfMeasureRepository uomRepository;

    public StorageFacilityService(StorageFacilityRepository repository, LocationRepository locationRepository,
                                   CountryRepository countryRepository, UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.locationRepository = locationRepository;
        this.countryRepository = countryRepository;
        this.uomRepository = uomRepository;
    }

    private StorageFacility hydrate(StorageFacility facility) {
        Location location = locationRepository.findById(facility.getLocationId()).orElse(null);
        if (location != null) {
            facility.setLocationCode(location.getLocationCode());
            countryRepository.findById(location.getCountryId()).ifPresent(c -> facility.setCountryCode(c.getCountryCode()));
        }
        if (facility.getCapacityUomId() != null) {
            uomRepository.findById(facility.getCapacityUomId()).ifPresent(u -> facility.setCapacityUomCode(u.getUomCode()));
        }
        return facility;
    }

    private void normalizeCodeField(StorageFacility input) {
        if (input.getStorageCode() != null) input.setStorageCode(input.getStorageCode().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<StorageFacility> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public StorageFacility create(StorageFacility input) {
        normalizeCodeField(input);
        if (repository.existsByStorageCodeIgnoreCase(input.getStorageCode())) {
            throw new ConflictException("Storage Code \"" + input.getStorageCode() + "\" already exists.");
        }
        input.setStorageId(null);
        return hydrate(repository.save(input));
    }

    public StorageFacility update(Integer id, StorageFacility input) {
        StorageFacility existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No storage facility with id " + id + "."));
        normalizeCodeField(input);
        input.setStorageId(id);
        // V151 — created_at/created_by are @CreatedDate/@CreatedBy — JPA
        // auditing only populates those on insert, so the request body never
        // carries them; without copying them from the existing row here,
        // updatable=false keeps the DB value untouched but the response
        // would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        StorageFacility existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No storage facility with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
