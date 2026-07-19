package com.etrm.system.commodity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

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

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    // Read-only entity today (no create/update endpoint), added for schema
    // consistency.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "commodity_code", nullable = false, length = 20)
    private String commodityCode;

    public Integer getCommodityId() {
        return commodityId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public String getCommodityCode() {
        return commodityCode;
    }
}
