package com.etrm.system.storagefacility;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StorageFacilityTypeRepository extends JpaRepository<StorageFacilityType, Integer> {
    Optional<StorageFacilityType> findByTypeCodeIgnoreCase(String typeCode);
}
