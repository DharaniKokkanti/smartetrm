package com.etrm.system.market;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketProductPeriodRepository extends JpaRepository<MarketProductPeriod, Integer> {
    List<MarketProductPeriod> findByMarketProductId(Integer marketProductId);
}
