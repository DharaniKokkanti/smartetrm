package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PricingTypeRepository extends JpaRepository<PricingType, Integer> {
    Optional<PricingType> findByTypeCodeIgnoreCase(String typeCode);
}
