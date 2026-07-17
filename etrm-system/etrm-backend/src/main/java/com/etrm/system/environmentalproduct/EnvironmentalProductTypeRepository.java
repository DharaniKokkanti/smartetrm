package com.etrm.system.environmentalproduct;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EnvironmentalProductTypeRepository extends JpaRepository<EnvironmentalProductType, Integer> {
    Optional<EnvironmentalProductType> findByTypeCodeIgnoreCase(String typeCode);
}
