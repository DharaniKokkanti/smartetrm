package com.etrm.system.market;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketProductSourceRepository extends JpaRepository<MarketProductSource, Integer> {
    List<MarketProductSource> findByMarketProductId(Integer marketProductId);
}
