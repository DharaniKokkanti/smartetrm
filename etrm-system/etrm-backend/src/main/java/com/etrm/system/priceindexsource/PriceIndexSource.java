package com.etrm.system.priceindexsource;

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
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import jakarta.persistence.EntityListeners;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.price_index_source is a link table between dbo.price_index and
 * dbo.price_source (price_index_id/price_source_id both NOT NULL FKs).
 * Only created_at/created_by exist live (no updated_at/updated_by), so
 * mapped manually with @CreatedDate/@CreatedBy like Period.java, not via
 * AuditableEntity. priceIndexCode/priceIndexName hydrated from PriceIndex,
 * sourceCode/sourceName hydrated from PriceSource — see
 * PriceIndexSourceService.hydrate(). source_role is a plain
 * CHECK-constrained string, not an FK.
 */
@Entity
@Table(name = "price_index_source")
@EntityListeners(AuditingEntityListener.class)
public class PriceIndexSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pis_id")
    private Integer pisId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "price_index_id", nullable = false)
    private Integer priceIndexId;

    @Transient
    @JsonProperty
    private String priceIndexCode;

    @Transient
    @JsonProperty
    private String priceIndexName;

    @NotNull
    @Column(name = "price_source_id", nullable = false)
    private Integer priceSourceId;

    @Transient
    @JsonProperty
    private String sourceCode;

    @Transient
    @JsonProperty
    private String sourceName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "source_role", nullable = false, length = 20)
    private String sourceRole;

    @Size(max = 100)
    @Column(name = "source_field_code", length = 100)
    private String sourceFieldCode;

    @Size(max = 100)
    @Column(name = "source_ticker", length = 100)
    private String sourceTicker;

    @NotNull
    @Column(name = "price_multiplier", nullable = false, precision = 10, scale = 6)
    private BigDecimal priceMultiplier;

    @NotNull
    @Column(name = "price_offset", nullable = false, precision = 18, scale = 4)
    private BigDecimal priceOffset;

    @NotNull
    @Column(name = "calculation_sequence", nullable = false)
    private Short calculationSequence;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

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

    public Integer getPisId() {
        return pisId;
    }

    public void setPisId(Integer pisId) {
        this.pisId = pisId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public String getPriceIndexCode() {
        return priceIndexCode;
    }

    public void setPriceIndexCode(String priceIndexCode) {
        this.priceIndexCode = priceIndexCode;
    }

    public String getPriceIndexName() {
        return priceIndexName;
    }

    public void setPriceIndexName(String priceIndexName) {
        this.priceIndexName = priceIndexName;
    }

    public Integer getPriceSourceId() {
        return priceSourceId;
    }

    public void setPriceSourceId(Integer priceSourceId) {
        this.priceSourceId = priceSourceId;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getSourceRole() {
        return sourceRole;
    }

    public void setSourceRole(String sourceRole) {
        this.sourceRole = sourceRole;
    }

    public String getSourceFieldCode() {
        return sourceFieldCode;
    }

    public void setSourceFieldCode(String sourceFieldCode) {
        this.sourceFieldCode = sourceFieldCode;
    }

    public String getSourceTicker() {
        return sourceTicker;
    }

    public void setSourceTicker(String sourceTicker) {
        this.sourceTicker = sourceTicker;
    }

    public BigDecimal getPriceMultiplier() {
        return priceMultiplier;
    }

    public void setPriceMultiplier(BigDecimal priceMultiplier) {
        this.priceMultiplier = priceMultiplier;
    }

    public BigDecimal getPriceOffset() {
        return priceOffset;
    }

    public void setPriceOffset(BigDecimal priceOffset) {
        this.priceOffset = priceOffset;
    }

    public Short getCalculationSequence() {
        return calculationSequence;
    }

    public void setCalculationSequence(Short calculationSequence) {
        this.calculationSequence = calculationSequence;
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
}
