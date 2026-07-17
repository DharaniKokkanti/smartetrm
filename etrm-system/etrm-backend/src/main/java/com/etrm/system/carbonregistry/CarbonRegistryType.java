package com.etrm.system.carbonregistry;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Read path only — dbo.carbon_registry_type is a dedicated type-lookup table
 * (type_code/type_name) that carbon_registry.registry_type points at.
 */
@Entity
@Table(name = "carbon_registry_type")
public class CarbonRegistryType {

    @Id
    @Column(name = "carbon_registry_type_id")
    private Integer carbonRegistryTypeId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getCarbonRegistryTypeId() {
        return carbonRegistryTypeId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
