package com.etrm.system.clearingaccount;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClearingAccountMarginRateRepository extends JpaRepository<ClearingAccountMarginRate, Integer> {
    List<ClearingAccountMarginRate> findByClearingAccountId(Integer clearingAccountId);
}
