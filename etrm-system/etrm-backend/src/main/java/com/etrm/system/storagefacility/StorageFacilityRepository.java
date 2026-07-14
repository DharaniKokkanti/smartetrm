package com.etrm.system.storagefacility;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StorageFacilityRepository extends JpaRepository<StorageFacility, Integer> {
    boolean existsByStorageCodeIgnoreCase(String storageCode);
}
