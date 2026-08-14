package com.etrm.system.taxcode;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * dbo.tax_code is a Tier 2 table (CRUD via the generic
 * ReferenceDataController, registered in master_data_table_registry) — this
 * read-only entity exists solely so GlAccountService can resolve
 * gl_account.default_tax_code_id to its code for display.
 */
@Entity
@Table(name = "ref_tax_code")
public class TaxCode {

    @Id
    @Column(name = "tax_code_id")
    private Integer taxCodeId;

    @Column(name = "tax_code")
    private String taxCode;

    @Column(name = "description")
    private String description;

    @Column(name = "rate_percent")
    private BigDecimal ratePercent;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    private void onPrePersist() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    private void onPreUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getTaxCodeId() {
        return taxCodeId;
    }

    public String getTaxCode() {
        return taxCode;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getRatePercent() {
        return ratePercent;
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
