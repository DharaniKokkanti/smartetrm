package com.etrm.system.vessel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import com.etrm.system.common.SourceSystemDefaults;

/**
 * dbo.vessel_type is served generically via the Tier2 reference-data
 * mechanism (no dedicated controller) — minimal read-only reader so
 * VesselService can resolve vessel_type_id -> its code/name for display.
 * Converted from a hardcoded VARCHAR+CHECK in V111, matching the
 * book_type/connection_type precedent.
 */
@Entity
@Table(name = "ref_vessel_type")
public class VesselType {

    @Id
    @Column(name = "vessel_type_id")
    private Integer vesselTypeId;

    @Column(name = "type_code", nullable = false, length = 30)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 150)
    private String typeName;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    protected void onPrePersist() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    protected void onPreUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getVesselTypeId() {
        return vesselTypeId;
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

    public void setCreatedSrcId(Short createdSrcId) {
        this.createdSrcId = createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
