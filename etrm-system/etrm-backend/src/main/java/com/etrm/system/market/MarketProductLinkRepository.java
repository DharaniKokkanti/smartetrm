package com.etrm.system.market;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketProductLinkRepository extends JpaRepository<MarketProductLink, Integer> {
    List<MarketProductLink> findByMarketId(Integer marketId);
    List<MarketProductLink> findByProductId(Integer productId);
}
