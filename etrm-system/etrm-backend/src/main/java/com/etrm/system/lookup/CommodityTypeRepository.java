package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommodityTypeRepository extends JpaRepository<CommodityType, Integer> {
    Optional<CommodityType> findByTypeCodeIgnoreCase(String typeCode);
}
