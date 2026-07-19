package com.etrm.system.product;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;

/**
 * classification_type_id is NOT NULL but the frontend's write contract
 * (ProductReportingGroupInput = {reportingGroupId}) never sends it —
 * ProductReportingGroupService derives it from the chosen reporting_group's
 * own classification_type_id, matching that "a reporting group belongs to
 * one classification axis" already established by dbo.reporting_group.
 */
@Entity
@Table(name = "product_reporting_group")
public class ProductReportingGroup extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_reporting_group_id")
    private Integer productReportingGroupId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @NotNull
    @Column(name = "reporting_group_id", nullable = false)
    private Integer reportingGroupId;

    @Transient
    @JsonProperty
    private String groupName;

    @NotNull
    @Column(name = "classification_type_id", nullable = false)
    private Integer classificationTypeId;

    @Transient
    @JsonProperty
    private String classificationTypeCode;

    public Integer getProductReportingGroupId() {
        return productReportingGroupId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setProductReportingGroupId(Integer productReportingGroupId) {
        this.productReportingGroupId = productReportingGroupId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public Integer getReportingGroupId() {
        return reportingGroupId;
    }

    public void setReportingGroupId(Integer reportingGroupId) {
        this.reportingGroupId = reportingGroupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public Integer getClassificationTypeId() {
        return classificationTypeId;
    }

    public void setClassificationTypeId(Integer classificationTypeId) {
        this.classificationTypeId = classificationTypeId;
    }

    public String getClassificationTypeCode() {
        return classificationTypeCode;
    }

    public void setClassificationTypeCode(String classificationTypeCode) {
        this.classificationTypeCode = classificationTypeCode;
    }
}
