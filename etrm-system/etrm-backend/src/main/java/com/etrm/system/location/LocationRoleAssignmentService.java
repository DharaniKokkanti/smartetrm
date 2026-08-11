package com.etrm.system.location;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LocationRoleAssignmentService {

    private final LocationRoleAssignmentRepository repository;
    private final LocationRepository locationRepository;
    private final LocationTypeRepository locationTypeRepository;

    public LocationRoleAssignmentService(LocationRoleAssignmentRepository repository, LocationRepository locationRepository,
                                          LocationTypeRepository locationTypeRepository) {
        this.repository = repository;
        this.locationRepository = locationRepository;
        this.locationTypeRepository = locationTypeRepository;
    }

    private LocationRoleAssignment hydrate(LocationRoleAssignment role) {
        locationTypeRepository.findById(role.getLocationTypeId())
                .ifPresent(t -> role.setLocationTypeCode(t.getTypeCode()));
        return role;
    }

    private void resolveForeignKeys(LocationRoleAssignment input) {
        if (input.getLocationTypeCode() != null) {
            LocationType type = locationTypeRepository.findByTypeCodeIgnoreCase(input.getLocationTypeCode())
                    .orElseThrow(() -> new NotFoundException("No location type \"" + input.getLocationTypeCode() + "\"."));
            input.setLocationTypeId(type.getLocationTypeId());
        }
    }

    @Transactional(readOnly = true)
    public List<LocationRoleAssignment> listForLocation(Integer locationId) {
        return repository.findByLocationIdOrderByLocationTypeIdAsc(locationId).stream().map(this::hydrate).toList();
    }

    public LocationRoleAssignment create(Integer locationId, LocationRoleAssignment input) {
        locationRepository.findById(locationId)
                .orElseThrow(() -> new NotFoundException("No location with id " + locationId + "."));
        resolveForeignKeys(input);
        if (repository.existsByLocationIdAndLocationTypeId(locationId, input.getLocationTypeId())) {
            throw new ConflictException("This location already has that role assigned.");
        }
        input.setLocationRoleAssignmentId(null);
        input.setLocationId(locationId);
        return hydrate(repository.save(input));
    }

    public LocationRoleAssignment update(Integer locationId, Integer id, LocationRoleAssignment input) {
        LocationRoleAssignment existing = repository.findById(id)
                .filter(r -> r.getLocationId().equals(locationId))
                .orElseThrow(() -> new NotFoundException("No role assignment with id " + id + " on location " + locationId + "."));
        resolveForeignKeys(input);
        input.setLocationRoleAssignmentId(id);
        input.setLocationId(locationId);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        input.setCreatedSrcId(existing.getCreatedSrcId());
        return hydrate(repository.save(input));
    }

    public void delete(Integer locationId, Integer id) {
        LocationRoleAssignment existing = repository.findById(id)
                .filter(r -> r.getLocationId().equals(locationId))
                .orElseThrow(() -> new NotFoundException("No role assignment with id " + id + " on location " + locationId + "."));
        repository.delete(existing);
    }
}
