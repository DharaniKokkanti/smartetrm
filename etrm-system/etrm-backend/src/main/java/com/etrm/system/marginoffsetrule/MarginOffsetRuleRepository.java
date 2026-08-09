package com.etrm.system.marginoffsetrule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarginOffsetRuleRepository extends JpaRepository<MarginOffsetRule, Integer> {
    List<MarginOffsetRule> findByExchangeId(Integer exchangeId);
}
