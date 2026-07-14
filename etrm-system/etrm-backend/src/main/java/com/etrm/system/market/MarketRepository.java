package com.etrm.system.market;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketRepository extends JpaRepository<Market, Integer> {
    boolean existsByMarketCodeIgnoreCase(String marketCode);
}
