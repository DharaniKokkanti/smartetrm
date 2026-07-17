package com.etrm.system.carbonregistry;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CarbonRegistryTypeRepository extends JpaRepository<CarbonRegistryType, Integer> {
    Optional<CarbonRegistryType> findByTypeCodeIgnoreCase(String typeCode);
}
