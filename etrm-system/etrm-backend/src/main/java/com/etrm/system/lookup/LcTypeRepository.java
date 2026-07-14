package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LcTypeRepository extends JpaRepository<LcType, Integer> {
    Optional<LcType> findByTypeCodeIgnoreCase(String typeCode);
}
