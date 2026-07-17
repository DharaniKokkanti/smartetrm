package com.etrm.system.commodityinstrumentmap;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Table;

/**
 * dbo.commodity_instrument_type_config (V45) — the real, pre-existing,
 * already-seeded table for this data. An earlier pass this session built a
 * parallel `commodity_instrument_map` table (V113) without checking whether
 * this one already existed under a different name; V115 drops that
 * duplicate and this class now points at the real table instead.
 * commodity_type is a plain VARCHAR here (not an FK to commodity_type_id —
 * simpler than V113's design), composite-keyed on (commodity_type,
 * instrument_type). Read-only from the API's perspective — no create/
 * update/delete endpoint (matches V45's own migration comment: "no UI CRUD,
 * only DBA/vendor adds rows via migration").
 */
@Entity
@Table(name = "commodity_instrument_type_config")
public class CommodityInstrumentMapEntry {

    @EmbeddedId
    private CommodityInstrumentMapKey id;

    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    public String getCommodityType() {
        return id.getCommodityType();
    }

    public String getInstrumentType() {
        return id.getInstrumentType();
    }

    public Short getSortOrder() {
        return sortOrder;
    }

    public Boolean getIsActive() {
        return isActive;
    }
}
