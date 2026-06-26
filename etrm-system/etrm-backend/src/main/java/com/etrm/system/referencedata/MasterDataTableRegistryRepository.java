package com.etrm.system.referencedata;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterDataTableRegistryRepository extends JpaRepository<MasterDataTableRegistry, Long> {
    List<MasterDataTableRegistry> findByIsEnabledTrue();
    Optional<MasterDataTableRegistry> findByTableNameIgnoreCaseAndIsEnabledTrue(String tableName);
}
