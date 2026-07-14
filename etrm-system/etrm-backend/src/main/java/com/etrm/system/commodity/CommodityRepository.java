package com.etrm.system.commodity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommodityRepository extends JpaRepository<Commodity, Integer> {
    Optional<Commodity> findByCommodityCodeIgnoreCase(String commodityCode);
}
