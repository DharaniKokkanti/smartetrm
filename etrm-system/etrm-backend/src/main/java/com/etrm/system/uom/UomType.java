package com.etrm.system.uom;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * dbo.uom_type is served generically via the Tier2 reference-data mechanism
 * (no dedicated controller) — minimal read-only reader so
 * UnitOfMeasureService can resolve uom_category -> its code for display.
 */
@Entity
@Table(name = "mst_uom_type")
public class UomType {

    @Id
    @Column(name = "uom_type_id")
    private Integer uomTypeId;

    @Column(name = "type_code", nullable = false, length = 30)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

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

    public Integer getUomTypeId() {
        return uomTypeId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
