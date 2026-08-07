package com.etrm.system.lookup;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Read path only — lookup_value/lookup_category are already fully editable
 * via the generic Tier 2 mechanism (ReferenceDataController); this entity
 * exists purely so other services (Book, Trader, ...) can resolve a
 * category+code to a lookup_id (or back) server-side, the same translation
 * the frontend already does client-side via hardcoded id tables like
 * organization/desks/types.ts's COMMODITY_TYPE_LOOKUP.
 */
@Entity
@Table(name = "lookup_value")
public class LookupValue {

    @Id
    @Column(name = "lookup_id")
    private Integer lookupId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

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

    public Integer getLookupId() {
        return lookupId;
    }

    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
