package com.etrm.system.regulatoryobligation;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * dbo.regulatory_report_type — read-only reader, standard type_code/
 * type_name dedicated-lookup pattern (see CommodityType.java). Referenced
 * by an earlier session's ReferenceDataCrudSmokeTest run (its CHECK
 * constraint chk_rrt_reg fired during that generic sweep), confirming this
 * table already exists live.
 */
@Entity
@Table(name = "regulatory_report_type")
public class RegulatoryReportType {

    @Id
    @Column(name = "report_type_id")
    private Integer reportTypeId;

    @Column(name = "report_code", nullable = false, length = 50)
    private String reportCode;

    @Column(name = "report_name", nullable = false, length = 200)
    private String reportName;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    private void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    private void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getReportTypeId() {
        return reportTypeId;
    }

    public String getReportCode() {
        return reportCode;
    }

    public String getReportName() {
        return reportName;
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
