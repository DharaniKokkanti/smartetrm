package com.etrm.system.uom;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.unit_of_measure is NOT registered in master_data_table_registry —
 * reference/uom/UomPage.tsx is a bespoke frontend page with no backend yet
 * (belongs to a later batch). Read-only for now, added early only so
 * BrokerFeeAgreementService can resolve uom_id -> code for display.
 */
@Entity
@Table(name = "unit_of_measure")
public class UnitOfMeasure {

    @Id
    @Column(name = "uom_id")
    private Integer uomId;

    @Column(name = "uom_code", nullable = false, length = 20)
    private String uomCode;

    public Integer getUomId() {
        return uomId;
    }

    public String getUomCode() {
        return uomCode;
    }
}
