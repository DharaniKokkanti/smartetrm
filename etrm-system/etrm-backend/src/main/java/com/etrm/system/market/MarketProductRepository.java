package com.etrm.system.market;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketProductRepository extends JpaRepository<MarketProduct, Integer> {
    List<MarketProduct> findByMarketId(Integer marketId);
    List<MarketProduct> findByProductId(Integer productId);
}
