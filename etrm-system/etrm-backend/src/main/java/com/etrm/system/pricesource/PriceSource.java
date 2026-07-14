package com.etrm.system.pricesource;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.price_source is NOT registered in master_data_table_registry —
 * pricing/price-sources is a bespoke frontend page with no backend yet
 * (deferred to the Pricing & Rates batch). Read-only for now, added early
 * only so MarketProductSourceService can resolve price_source_id -> code/
 * name for display.
 */
@Entity
@Table(name = "price_source")
public class PriceSource {

    @Id
    @Column(name = "price_source_id")
    private Integer priceSourceId;

    @Column(name = "source_code", nullable = false, length = 30)
    private String sourceCode;

    @Column(name = "source_name", nullable = false, length = 200)
    private String sourceName;

    public Integer getPriceSourceId() {
        return priceSourceId;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public String getSourceName() {
        return sourceName;
    }
}
