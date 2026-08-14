package com.etrm.system.carbonregistry;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Read path only — dbo.carbon_registry_type is a dedicated type-lookup table
 * (type_code/type_name) that carbon_registry.registry_type points at.
 */
@Entity
@Table(name = "mst_carbon_registry_type")
public class CarbonRegistryType {

    @Id
    @Column(name = "carbon_registry_type_id")
    private Integer carbonRegistryTypeId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    public Integer getCarbonRegistryTypeId() {
        return carbonRegistryTypeId;
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

    @PrePersist
    protected void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }
}
