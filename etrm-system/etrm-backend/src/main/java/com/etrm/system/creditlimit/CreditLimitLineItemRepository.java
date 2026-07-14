package com.etrm.system.creditlimit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditLimitLineItemRepository extends JpaRepository<CreditLimitLineItem, Integer> {
    List<CreditLimitLineItem> findByCreditLimitId(Integer creditLimitId);
    void deleteByCreditLimitId(Integer creditLimitId);
}
