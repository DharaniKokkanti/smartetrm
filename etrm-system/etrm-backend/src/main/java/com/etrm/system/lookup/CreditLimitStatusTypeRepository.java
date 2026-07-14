package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CreditLimitStatusTypeRepository extends JpaRepository<CreditLimitStatusType, Integer> {
    Optional<CreditLimitStatusType> findByTypeCodeIgnoreCase(String typeCode);
}
