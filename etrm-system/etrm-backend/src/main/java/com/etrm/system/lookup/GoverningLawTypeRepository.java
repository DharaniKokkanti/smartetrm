package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoverningLawTypeRepository extends JpaRepository<GoverningLawType, Integer> {
    Optional<GoverningLawType> findByTypeCodeIgnoreCase(String typeCode);
}
