package com.etrm.system.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** created_at/created_by/updated_at/updated_by governance columns added by
 * V149 (updated_at/updated_by new; created_at/created_by upgraded to real
 * @CreatedDate/@CreatedBy fields — see GlAccount.java's doc comment). */
@Entity
@Table(name = "product_blend_component")
@EntityListeners(AuditingEntityListener.class)
public class ProductBlendComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blend_component_id")
    private Integer blendComponentId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

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

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false, length = 100)
    private String createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    @NotNull
    @Column(name = "needs_position_gen", nullable = false)
    private Boolean needsPositionGen = false;

    public Integer getBlendComponentId() {
        return blendComponentId;
    }

    public void setBlendComponentId(Integer blendComponentId) {
        this.blendComponentId = blendComponentId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public Boolean getNeedsPositionGen() {
        return needsPositionGen;
    }

    public void setNeedsPositionGen(Boolean needsPositionGen) {
        this.needsPositionGen = needsPositionGen;
    }
}
