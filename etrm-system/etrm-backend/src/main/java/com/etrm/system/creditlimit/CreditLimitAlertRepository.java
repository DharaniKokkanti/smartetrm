package com.etrm.system.creditlimit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditLimitAlertRepository extends JpaRepository<CreditLimitAlert, Integer> {
    List<CreditLimitAlert> findByCreditLimitId(Integer creditLimitId);
}
