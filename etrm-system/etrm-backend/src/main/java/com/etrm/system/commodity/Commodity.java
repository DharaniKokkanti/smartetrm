package com.etrm.system.commodity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.commodity is NOT registered in master_data_table_registry — no
 * bespoke frontend page references it directly either (products/types.ts
 * resolves against it via a raw fetch of rows, not a dedicated feature).
 * Read-only, added so Market/PriceIndex services can resolve
 * commodity_id -> the broad CommodityType string the frontend uses (see
 * CommodityTypeMapping).
 */
@Entity
@Table(name = "commodity")
public class Commodity {

    @Id
    @Column(name = "commodity_id")
    private Integer commodityId;

    @Column(name = "commodity_code", nullable = false, length = 20)
    private String commodityCode;

    public Integer getCommodityId() {
        return commodityId;
    }

    public String getCommodityCode() {
        return commodityCode;
    }
}
