package com.etrm.system.environmentalproduct;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Read path only — dbo.environmental_product_type is a dedicated type-lookup
 * table (type_code/type_name) that environmental_product.product_type points at.
 */
@Entity
@Table(name = "environmental_product_type")
public class EnvironmentalProductType {

    @Id
    @Column(name = "environmental_product_type_id")
    private Integer environmentalProductTypeId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getEnvironmentalProductTypeId() {
        return environmentalProductTypeId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
