package com.etrm.system.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_blend_component")
public class ProductBlendComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blend_component_id")
    private Integer blendComponentId;

    @NotNull
    @Column(name = "parent_product_id", nullable = false)
    private Integer parentProductId;

    @NotNull
    @Column(name = "component_product_id", nullable = false)
    private Integer componentProductId;

    @Transient
    @JsonProperty
    private String componentCode;

    @Transient
    @JsonProperty
    private String componentName;

    // TINYINT -> Short.
    @NotNull
    @Column(name = "sequence_no", nullable = false)
    private Short sequenceNo;

    @Column(name = "min_pct")
    private BigDecimal minPct;

    @NotNull
    @Column(name = "target_pct", nullable = false)
    private BigDecimal targetPct;

    @Column(name = "max_pct")
    private BigDecimal maxPct;

    @NotNull
    @Column(name = "tolerance_pct", nullable = false)
    private BigDecimal tolerancePct;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", updatable = false, length = 100)
    private String createdBy;

    @NotNull
    @Column(name = "needs_position_gen", nullable = false)
    private Boolean needsPositionGen = false;

    public Integer getBlendComponentId() {
        return blendComponentId;
    }

    public void setBlendComponentId(Integer blendComponentId) {
        this.blendComponentId = blendComponentId;
    }

    public Integer getParentProductId() {
        return parentProductId;
    }

    public void setParentProductId(Integer parentProductId) {
        this.parentProductId = parentProductId;
    }

    public Integer getComponentProductId() {
        return componentProductId;
    }

    public void setComponentProductId(Integer componentProductId) {
        this.componentProductId = componentProductId;
    }

    public String getComponentCode() {
        return componentCode;
    }

    public void setComponentCode(String componentCode) {
        this.componentCode = componentCode;
    }

    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public Short getSequenceNo() {
        return sequenceNo;
    }

    public void setSequenceNo(Short sequenceNo) {
        this.sequenceNo = sequenceNo;
    }

    public BigDecimal getMinPct() {
        return minPct;
    }

    public void setMinPct(BigDecimal minPct) {
        this.minPct = minPct;
    }

    public BigDecimal getTargetPct() {
        return targetPct;
    }

    public void setTargetPct(BigDecimal targetPct) {
        this.targetPct = targetPct;
    }

    public BigDecimal getMaxPct() {
        return maxPct;
    }

    public void setMaxPct(BigDecimal maxPct) {
        this.maxPct = maxPct;
    }

    public BigDecimal getTolerancePct() {
        return tolerancePct;
    }

    public void setTolerancePct(BigDecimal tolerancePct) {
        this.tolerancePct = tolerancePct;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    public Boolean getNeedsPositionGen() {
        return needsPositionGen;
    }

    public void setNeedsPositionGen(Boolean needsPositionGen) {
        this.needsPositionGen = needsPositionGen;
    }
}
