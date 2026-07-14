package com.etrm.system.collateraltype;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Read-only — already generic-Tier2-registered. Added early for Collateral's denorm display name. */
@Entity
@Table(name = "collateral_type")
public class CollateralType {

    @Id
    @Column(name = "collateral_type_id")
    private Integer collateralTypeId;

    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    public Integer getCollateralTypeId() {
        return collateralTypeId;
    }

    public String getTypeName() {
        return typeName;
    }
}
