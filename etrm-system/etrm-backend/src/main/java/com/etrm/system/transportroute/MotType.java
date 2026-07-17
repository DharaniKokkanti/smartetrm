package com.etrm.system.transportroute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.mot_type — mode-of-transport lookup (VESSEL/BARGE/PIPELINE/TRUCK/
 * RAILCAR/ISO_CONTAINER/...). Read-only reader. Column names are mot_code/
 * mot_name here (NOT the type_code/type_name shape most other dedicated
 * lookups use — confirmed live via Hibernate schema validation catching a
 * first wrong guess). Only needed here to resolve
 * transport_route.mot_type_id -> motTypeName.
 */
@Entity
@Table(name = "mot_type")
public class MotType {

    @Id
    @Column(name = "mot_type_id")
    private Integer motTypeId;

    @Column(name = "mot_code", nullable = false, length = 50)
    private String motCode;

    @Column(name = "mot_name", nullable = false, length = 100)
    private String motName;

    public Integer getMotTypeId() {
        return motTypeId;
    }

    public String getMotCode() {
        return motCode;
    }

    public String getMotName() {
        return motName;
    }
}
