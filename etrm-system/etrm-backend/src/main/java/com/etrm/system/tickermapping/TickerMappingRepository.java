package com.etrm.system.tickermapping;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TickerMappingRepository extends JpaRepository<TickerMapping, Integer> {
    List<TickerMapping> findByPriceIndexId(Integer priceIndexId);

    boolean existsByPriceIndexIdAndPeriodIdAndPriceSourceId(Integer priceIndexId, Long periodId, Integer priceSourceId);
}
