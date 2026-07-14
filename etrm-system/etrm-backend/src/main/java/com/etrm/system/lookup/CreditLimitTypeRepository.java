package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CreditLimitTypeRepository extends JpaRepository<CreditLimitType, Integer> {
    Optional<CreditLimitType> findByTypeCodeIgnoreCase(String typeCode);
}
