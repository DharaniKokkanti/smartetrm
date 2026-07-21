package com.etrm.system.pipeline;

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
 * dbo.pipeline_tariff originally had only created_at/created_by, set
 * manually by PipelineTariffService — V148 added updated_at/updated_by
 * (governance-column sweep) and upgraded all 4 audit fields to real
 * @CreatedDate/@CreatedBy/@LastModifiedDate/@LastModifiedBy JPA-auditing
 * annotations. fromPointCode/toPointCode are resolved the same way as
 * PipelineSegment's (no dropdown was ever built against pipeline_point).
 */
@Entity
@Table(name = "pipeline_tariff")
@EntityListeners(AuditingEntityListener.class)
public class PipelineTariff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tariff_id")
    private Integer tariffId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "pipeline_id", nullable = false)
    private Integer pipelineId;

    @Transient
    @JsonProperty
    private String pipelineName;

    // Not @NotNull: fromPointId/toPointId are always resolved from
    // fromPointCode/toPointCode by PipelineTariffService.resolveForeignKeys
    // before save — same rationale as PipelineSegment's identical fields
    // (see that class's doc comment); a @NotNull here made every real
    // create 400 (caught by PipelineTariffControllerTest). The DB's own
    // NOT NULL constraint is still the final backstop.
    @Column(name = "from_point_id", nullable = false)
    private Integer fromPointId;

    @Transient
    @JsonProperty
    private String fromPointCode;

    @Column(name = "to_point_id", nullable = false)
    private Integer toPointId;

    @Transient
    @JsonProperty
    private String toPointCode;

    @Column(name = "product_id")
    private Integer productId;

    @Transient
    @JsonProperty
    private String productName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "tariff_type", nullable = false, length = 20)
    private String tariffType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "capacity_type", nullable = false, length = 20)
    private String capacityType;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "rate", nullable = false, precision = 18, scale = 8)
    private BigDecimal rate;

    @NotNull
    @Column(name = "rate_uom_id", nullable = false)
    private Integer rateUomId;

    @Transient
    @JsonProperty
    private String rateUomCode;

    @Size(max = 20)
    @Column(name = "season", length = 20)
    private String season;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Size(max = 100)
    @Column(name = "regulatory_ref", length = 100)
    private String regulatoryRef;

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

    public Integer getTariffId() {
        return tariffId;
    }

    public void setTariffId(Integer tariffId) {
        this.tariffId = tariffId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getPipelineId() {
        return pipelineId;
    }

    public void setPipelineId(Integer pipelineId) {
        this.pipelineId = pipelineId;
    }

    public String getPipelineName() {
        return pipelineName;
    }

    public void setPipelineName(String pipelineName) {
        this.pipelineName = pipelineName;
    }

    public Integer getFromPointId() {
        return fromPointId;
    }

    public void setFromPointId(Integer fromPointId) {
        this.fromPointId = fromPointId;
    }

    public String getFromPointCode() {
        return fromPointCode;
    }

    public void setFromPointCode(String fromPointCode) {
        this.fromPointCode = fromPointCode;
    }

    public Integer getToPointId() {
        return toPointId;
    }

    public void setToPointId(Integer toPointId) {
        this.toPointId = toPointId;
    }

    public String getToPointCode() {
        return toPointCode;
    }

    public void setToPointCode(String toPointCode) {
        this.toPointCode = toPointCode;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getTariffType() {
        return tariffType;
    }

    public void setTariffType(String tariffType) {
        this.tariffType = tariffType;
    }

    public String getCapacityType() {
        return capacityType;
    }

    public void setCapacityType(String capacityType) {
        this.capacityType = capacityType;
    }

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public Integer getRateUomId() {
        return rateUomId;
    }

    public void setRateUomId(Integer rateUomId) {
        this.rateUomId = rateUomId;
    }

    public String getRateUomCode() {
        return rateUomCode;
    }

    public void setRateUomCode(String rateUomCode) {
        this.rateUomCode = rateUomCode;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public String getRegulatoryRef() {
        return regulatoryRef;
    }

    public void setRegulatoryRef(String regulatoryRef) {
        this.regulatoryRef = regulatoryRef;
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
