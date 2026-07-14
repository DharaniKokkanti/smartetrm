package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarginAgreementTypeRepository extends JpaRepository<MarginAgreementType, Integer> {
    Optional<MarginAgreementType> findByTypeCodeIgnoreCase(String typeCode);
}
