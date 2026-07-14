package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ValuationFrequencyTypeRepository extends JpaRepository<ValuationFrequencyType, Integer> {
    Optional<ValuationFrequencyType> findByTypeCodeIgnoreCase(String typeCode);
}
