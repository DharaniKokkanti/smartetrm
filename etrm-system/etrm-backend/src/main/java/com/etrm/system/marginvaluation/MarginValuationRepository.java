package com.etrm.system.marginvaluation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarginValuationRepository extends JpaRepository<MarginValuation, Long> {
    List<MarginValuation> findByClearingAccountIdOrderByValuationDateDesc(Integer clearingAccountId);
}
