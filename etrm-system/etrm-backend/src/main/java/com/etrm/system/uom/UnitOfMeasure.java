package com.etrm.system.uom;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Upgraded in place from the batch-1 minimal read-only reader (id/uomCode
 * only, used internally by several services for uomId -> code display) into
 * the full entity behind /api/v1/uom, per the "upgrade a minimal reader into
 * a full entity in place" convention (same as the Market upgrade in batch 5)
 * — every existing UnitOfMeasureRepository.findById().getUomCode() call site
 * keeps working unchanged. dbo.unit_of_measure had no audit columns at all
 * until V111 added created_at (matching the currency precedent from V98) —
 * still no created_by/updated_at/updated_by, so this does not extend
 * AuditableEntity.
 */
@Entity
@Table(name = "unit_of_measure")
public class UnitOfMeasure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "uom_id")
    private Integer uomId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 20)
    @Column(name = "uom_code", nullable = false, length = 20)
    private String uomCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "uom_name", nullable = false, length = 100)
    private String uomName;

    @NotNull
    @Column(name = "uom_category", nullable = false)
    private Integer uomTypeId;

    @Transient
    @JsonProperty
    private String uomTypeCode;

    @Size(max = 20)
    @Column(name = "base_uom_code", length = 20)
    private String baseUomCode;

    @Column(name = "conversion_factor", precision = 13, scale = 6)
    private BigDecimal conversionFactor;

    @Column(name = "commodity_type")
    private Integer commodityTypeId;

    @Transient
    @JsonProperty
    private String commodityTypeCode;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Integer getUomId() {
        return uomId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setUomId(Integer uomId) {
        this.uomId = uomId;
    }

    public String getUomCode() {
        return uomCode;
    }

    public void setUomCode(String uomCode) {
        this.uomCode = uomCode;
    }

    public String getUomName() {
        return uomName;
    }

    public void setUomName(String uomName) {
        this.uomName = uomName;
    }

    public Integer getUomTypeId() {
        return uomTypeId;
    }

    public void setUomTypeId(Integer uomTypeId) {
        this.uomTypeId = uomTypeId;
    }

    public String getUomTypeCode() {
        return uomTypeCode;
    }

    public void setUomTypeCode(String uomTypeCode) {
        this.uomTypeCode = uomTypeCode;
    }

    public String getBaseUomCode() {
        return baseUomCode;
    }

    public void setBaseUomCode(String baseUomCode) {
        this.baseUomCode = baseUomCode;
    }

    public BigDecimal getConversionFactor() {
        return conversionFactor;
    }

    public void setConversionFactor(BigDecimal conversionFactor) {
        this.conversionFactor = conversionFactor;
    }

    public Integer getCommodityTypeId() {
        return commodityTypeId;
    }

    public void setCommodityTypeId(Integer commodityTypeId) {
        this.commodityTypeId = commodityTypeId;
    }

    public String getCommodityTypeCode() {
        return commodityTypeCode;
    }

    public void setCommodityTypeCode(String commodityTypeCode) {
        this.commodityTypeCode = commodityTypeCode;
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
}
