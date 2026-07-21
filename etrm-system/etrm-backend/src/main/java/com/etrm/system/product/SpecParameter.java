package com.etrm.system.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Catalog of quality-spec parameters (e.g. sulphur %, API gravity) — not
 * itself product-scoped.
 *
 * V151 — added created_at/created_by/updated_at/updated_by (this dedicated
 * entity had fallen outside V137's registry-only governance-column audit).
 */
@Entity
@Table(name = "spec_parameter")
@EntityListeners(AuditingEntityListener.class)
public class SpecParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "parameter_id")
    private Integer parameterId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    // Read-only catalog today (no create/update endpoint), added for schema
    // consistency and in case a write path is added later.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @NotBlank
    @Size(max = 30)
    @Column(name = "parameter_code", nullable = false, length = 30)
    private String parameterCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "parameter_name", nullable = false, length = 200)
    private String parameterName;

    @NotBlank
    @Column(name = "parameter_category", nullable = false, length = 30)
    private String parameterCategory;

    @NotBlank
    @Column(name = "data_type", nullable = false, length = 20)
    private String dataType;

    @Column(name = "default_uom_id")
    private Integer defaultUomId;

    // TINYINT -> Short.
    @NotNull
    @Column(name = "decimal_places", nullable = false)
    private Short decimalPlaces = 2;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    public Integer getParameterId() {
        return parameterId;
    }

    public void setParameterId(Integer parameterId) {
        this.parameterId = parameterId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public String getParameterCode() {
        return parameterCode;
    }

    public void setParameterCode(String parameterCode) {
        this.parameterCode = parameterCode;
    }

    public String getParameterName() {
        return parameterName;
    }

    public void setParameterName(String parameterName) {
        this.parameterName = parameterName;
    }

    public String getParameterCategory() {
        return parameterCategory;
    }

    public void setParameterCategory(String parameterCategory) {
        this.parameterCategory = parameterCategory;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public Integer getDefaultUomId() {
        return defaultUomId;
    }

    public void setDefaultUomId(Integer defaultUomId) {
        this.defaultUomId = defaultUomId;
    }

    public Short getDecimalPlaces() {
        return decimalPlaces;
    }

    public void setDecimalPlaces(Short decimalPlaces) {
        this.decimalPlaces = decimalPlaces;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
