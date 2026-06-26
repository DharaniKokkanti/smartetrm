package com.etrm.system.legalentity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LegalEntityRepository extends JpaRepository<LegalEntity, Long> {
    Optional<LegalEntity> findByEntityCodeIgnoreCase(String entityCode);
    boolean existsByEntityCodeIgnoreCase(String entityCode);
}
