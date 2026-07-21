package com.etrm.system.costcenter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.cost_center is a Tier 2 table (CRUD via the generic
 * ReferenceDataController, registered in master_data_table_registry) — this
 * read-only entity exists solely so GlAccountService can resolve
 * gl_account.cost_center_id to its code for display, the same way it
 * already resolves legal_entity_id/book_id via their own repositories.
 */
@Entity
@Table(name = "cost_center")
public class CostCenter {

    @Id
    @Column(name = "cost_center_id")
    private Integer costCenterId;

    @Column(name = "cost_center_code")
    private String costCenterCode;

    @Column(name = "cost_center_name")
    private String costCenterName;

    @Column(name = "profit_center_id")
    private Integer profitCenterId;

    public Integer getCostCenterId() {
        return costCenterId;
    }

    public String getCostCenterCode() {
        return costCenterCode;
    }

    public String getCostCenterName() {
        return costCenterName;
    }

    public Integer getProfitCenterId() {
        return profitCenterId;
    }
}
