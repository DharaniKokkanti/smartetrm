package com.etrm.system.commodityinstrumentmap;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

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
@Table(name = "mst_commodity_instrument_type_config")
public class CommodityInstrumentMapEntry {

    @EmbeddedId
    private CommodityInstrumentMapKey id;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    // Read-only entity today (no create/update endpoint), added for schema
    // consistency.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    private void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    private void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public String getCommodityType() {
        return id.getCommodityType();
    }

    public Integer getRowVersion() {
        return rowVersion;
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

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
