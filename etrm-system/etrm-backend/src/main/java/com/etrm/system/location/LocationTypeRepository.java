package com.etrm.system.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LocationTypeRepository extends JpaRepository<LocationType, Integer> {
    Optional<LocationType> findByTypeCodeIgnoreCase(String typeCode);
}
