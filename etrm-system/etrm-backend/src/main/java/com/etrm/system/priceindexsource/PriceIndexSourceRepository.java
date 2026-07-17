package com.etrm.system.priceindexsource;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriceIndexSourceRepository extends JpaRepository<PriceIndexSource, Integer> {
    List<PriceIndexSource> findByPriceSourceId(Integer priceSourceId);
}
