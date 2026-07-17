package com.etrm.system.emissionscheme;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Read path only — dbo.emission_scheme_type is a dedicated type-lookup table
 * (type_code/type_name) that emission_scheme.scheme_type points at.
 */
@Entity
@Table(name = "emission_scheme_type")
public class EmissionSchemeType {

    @Id
    @Column(name = "emission_scheme_type_id")
    private Integer emissionSchemeTypeId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getEmissionSchemeTypeId() {
        return emissionSchemeTypeId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
