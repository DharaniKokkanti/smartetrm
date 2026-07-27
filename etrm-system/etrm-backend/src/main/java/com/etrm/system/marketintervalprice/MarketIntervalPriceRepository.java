package com.etrm.system.marketintervalprice;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MarketIntervalPriceRepository extends JpaRepository<MarketIntervalPrice, Long> {

    List<MarketIntervalPrice> findByPriceIndexIdAndIntervalStartUtcBetweenOrderByIntervalStartUtc(
            Integer priceIndexId, LocalDateTime from, LocalDateTime to);
}
