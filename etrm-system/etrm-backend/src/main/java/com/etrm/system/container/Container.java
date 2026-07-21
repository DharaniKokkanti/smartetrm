package com.etrm.system.container;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.container. approved_commodities is plain free-text CSV (no FK),
 * unlike railcar's equivalent concept.
 *
 * V145 — added updated_at/updated_by (this dedicated entity previously only
 * had created_at/created_by, and those were set manually by
 * ContainerService via AuditorAware rather than real JPA-auditing
 * annotations); upgraded all 4 audit fields to @CreatedDate/@CreatedBy/
 * @LastModifiedDate/@LastModifiedBy, matching GlAccount's shape.
 */
@Entity
@Table(name = "container")
@EntityListeners(AuditingEntityListener.class)
public class Container {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "container_id")
    private Integer containerId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 20)
    @Column(name = "container_number", nullable = false, length = 20)
    private String containerNumber;

    @NotBlank
    @Size(max = 20)
    @Column(name = "container_type", nullable = false, length = 20)
    private String containerType;

    @NotNull
    @Column(name = "operator_id", nullable = false)
    private Integer operatorId;

    @Transient
    @JsonProperty
    private String operatorName;

    @Column(name = "capacity_litres", precision = 12, scale = 2)
    private BigDecimal capacityLitres;

    @Column(name = "capacity_mt", precision = 10, scale = 3)
    private BigDecimal capacityMt;

    @Column(name = "tare_weight_kg", precision = 10, scale = 2)
    private BigDecimal tareWeightKg;

    @Column(name = "max_gross_weight_kg", precision = 10, scale = 2)
    private BigDecimal maxGrossWeightKg;

    @Size(max = 50)
    @Column(name = "un_approval", length = 50)
    private String unApproval;

    @Size(max = 500)
    @Column(name = "approved_commodities", length = 500)
    private String approvedCommodities;

    @Column(name = "csc_plate_expiry")
    private LocalDate cscPlateExpiry;

    @Column(name = "last_inspection_date")
    private LocalDate lastInspectionDate;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

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

    public Integer getContainerId() {
        return containerId;
    }

    public void setContainerId(Integer containerId) {
        this.containerId = containerId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getContainerNumber() {
        return containerNumber;
    }

    public void setContainerNumber(String containerNumber) {
        this.containerNumber = containerNumber;
    }

    public String getContainerType() {
        return containerType;
    }

    public void setContainerType(String containerType) {
        this.containerType = containerType;
    }

    public Integer getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Integer operatorId) {
        this.operatorId = operatorId;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public BigDecimal getCapacityLitres() {
        return capacityLitres;
    }

    public void setCapacityLitres(BigDecimal capacityLitres) {
        this.capacityLitres = capacityLitres;
    }

    public BigDecimal getCapacityMt() {
        return capacityMt;
    }

    public void setCapacityMt(BigDecimal capacityMt) {
        this.capacityMt = capacityMt;
    }

    public BigDecimal getTareWeightKg() {
        return tareWeightKg;
    }

    public void setTareWeightKg(BigDecimal tareWeightKg) {
        this.tareWeightKg = tareWeightKg;
    }

    public BigDecimal getMaxGrossWeightKg() {
        return maxGrossWeightKg;
    }

    public void setMaxGrossWeightKg(BigDecimal maxGrossWeightKg) {
        this.maxGrossWeightKg = maxGrossWeightKg;
    }

    public String getUnApproval() {
        return unApproval;
    }

    public void setUnApproval(String unApproval) {
        this.unApproval = unApproval;
    }

    public String getApprovedCommodities() {
        return approvedCommodities;
    }

    public void setApprovedCommodities(String approvedCommodities) {
        this.approvedCommodities = approvedCommodities;
    }

    public LocalDate getCscPlateExpiry() {
        return cscPlateExpiry;
    }

    public void setCscPlateExpiry(LocalDate cscPlateExpiry) {
        this.cscPlateExpiry = cscPlateExpiry;
    }

    public LocalDate getLastInspectionDate() {
        return lastInspectionDate;
    }

    public void setLastInspectionDate(LocalDate lastInspectionDate) {
        this.lastInspectionDate = lastInspectionDate;
    }

    public LocalDate getNextInspectionDate() {
        return nextInspectionDate;
    }

    public void setNextInspectionDate(LocalDate nextInspectionDate) {
        this.nextInspectionDate = nextInspectionDate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
