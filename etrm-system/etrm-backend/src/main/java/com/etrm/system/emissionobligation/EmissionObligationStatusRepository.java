package com.etrm.system.emissionobligation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmissionObligationStatusRepository extends JpaRepository<EmissionObligationStatus, Integer> {
    Optional<EmissionObligationStatus> findByTypeCodeIgnoreCase(String typeCode);
}
