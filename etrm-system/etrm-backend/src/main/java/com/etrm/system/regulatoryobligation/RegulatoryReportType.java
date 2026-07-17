package com.etrm.system.regulatoryobligation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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

    public Integer getReportTypeId() {
        return reportTypeId;
    }

    public String getReportCode() {
        return reportCode;
    }

    public String getReportName() {
        return reportName;
    }
}
