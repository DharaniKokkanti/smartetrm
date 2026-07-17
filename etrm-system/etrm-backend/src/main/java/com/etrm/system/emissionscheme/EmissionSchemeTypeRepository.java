package com.etrm.system.emissionscheme;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmissionSchemeTypeRepository extends JpaRepository<EmissionSchemeType, Integer> {
    Optional<EmissionSchemeType> findByTypeCodeIgnoreCase(String typeCode);
}
