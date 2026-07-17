package com.etrm.system.commodityinstrumentmap;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommodityInstrumentMapRepository extends JpaRepository<CommodityInstrumentMapEntry, CommodityInstrumentMapKey> {
    List<CommodityInstrumentMapEntry> findByIsActiveTrueOrderBySortOrder();
}
