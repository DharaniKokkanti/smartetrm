package com.etrm.system.emissionobligation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Read path only — dbo.emission_obligation_status is a dedicated type-lookup
 * table (type_code/type_name) that emission_obligation.status points at.
 */
@Entity
@Table(name = "emission_obligation_status")
public class EmissionObligationStatus {

    @Id
    @Column(name = "emission_obligation_status_id")
    private Integer emissionObligationStatusId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getEmissionObligationStatusId() {
        return emissionObligationStatusId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public String getTypeName() {
        return typeName;
    }
}
