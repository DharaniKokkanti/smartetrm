package com.etrm.system.laytime;

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
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Versioned, insert-only (prompt: "recalculation with full versioning ...
 * never overwrite, always version"). Only created_at/created_by — no
 * update endpoint in the service layer; a recalculation always inserts a
 * new row and flips the prior current row's is_current_version off.
 */
@Entity
@Table(name = "laytime_calculation")
public class LaytimeCalculation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "laytime_calculation_id")
    private Integer laytimeCalculationId;

    // V132 — optimistic locking (Batch E, voyage-ops/maritime). See V127/LegalEntity for the pattern.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "voyage_id", nullable = false)
    private Integer voyageId;

    @NotNull
    @Column(name = "port_location_id", nullable = false)
    private Integer portLocationId;

    @Transient
    @JsonProperty
    private String portLocationName;

    @Column(name = "laytime_term_id")
    private Integer laytimeTermId;

    @Transient
    @JsonProperty
    private String laytimeTermCode;

    @Column(name = "allowed_laytime_hours", precision = 10, scale = 2)
    private BigDecimal allowedLaytimeHours;

    @Column(name = "used_laytime_hours", precision = 10, scale = 2)
    private BigDecimal usedLaytimeHours;

    @Column(name = "demurrage_hours", precision = 10, scale = 2)
    private BigDecimal demurrageHours;

    @Column(name = "despatch_hours", precision = 10, scale = 2)
    private BigDecimal despatchHours;

    @Column(name = "demurrage_amount", precision = 14, scale = 2)
    private BigDecimal demurrageAmount;

    @Column(name = "despatch_amount", precision = 14, scale = 2)
    private BigDecimal despatchAmount;

    @Column(name = "currency_id")
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "version_number", nullable = false)
    private Integer versionNumber = 1;

    @NotNull
    @Column(name = "is_current_version", nullable = false)
    private Boolean isCurrentVersion = true;

    @Column(name = "superseded_by_version")
    private Integer supersededByVersion;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getLaytimeCalculationId() {
        return laytimeCalculationId;
    }

    public void setLaytimeCalculationId(Integer laytimeCalculationId) {
        this.laytimeCalculationId = laytimeCalculationId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getVoyageId() {
        return voyageId;
    }

    public void setVoyageId(Integer voyageId) {
        this.voyageId = voyageId;
    }

    public Integer getPortLocationId() {
        return portLocationId;
    }

    public void setPortLocationId(Integer portLocationId) {
        this.portLocationId = portLocationId;
    }

    public String getPortLocationName() {
        return portLocationName;
    }

    public void setPortLocationName(String portLocationName) {
        this.portLocationName = portLocationName;
    }

    public Integer getLaytimeTermId() {
        return laytimeTermId;
    }

    public void setLaytimeTermId(Integer laytimeTermId) {
        this.laytimeTermId = laytimeTermId;
    }

    public String getLaytimeTermCode() {
        return laytimeTermCode;
    }

    public void setLaytimeTermCode(String laytimeTermCode) {
        this.laytimeTermCode = laytimeTermCode;
    }

    public BigDecimal getAllowedLaytimeHours() {
        return allowedLaytimeHours;
    }

    public void setAllowedLaytimeHours(BigDecimal allowedLaytimeHours) {
        this.allowedLaytimeHours = allowedLaytimeHours;
    }

    public BigDecimal getUsedLaytimeHours() {
        return usedLaytimeHours;
    }

    public void setUsedLaytimeHours(BigDecimal usedLaytimeHours) {
        this.usedLaytimeHours = usedLaytimeHours;
    }

    public BigDecimal getDemurrageHours() {
        return demurrageHours;
    }

    public void setDemurrageHours(BigDecimal demurrageHours) {
        this.demurrageHours = demurrageHours;
    }

    public BigDecimal getDespatchHours() {
        return despatchHours;
    }

    public void setDespatchHours(BigDecimal despatchHours) {
        this.despatchHours = despatchHours;
    }

    public BigDecimal getDemurrageAmount() {
        return demurrageAmount;
    }

    public void setDemurrageAmount(BigDecimal demurrageAmount) {
        this.demurrageAmount = demurrageAmount;
    }

    public BigDecimal getDespatchAmount() {
        return despatchAmount;
    }

    public void setDespatchAmount(BigDecimal despatchAmount) {
        this.despatchAmount = despatchAmount;
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

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public Boolean getIsCurrentVersion() {
        return isCurrentVersion;
    }

    public void setIsCurrentVersion(Boolean isCurrentVersion) {
        this.isCurrentVersion = isCurrentVersion;
    }

    public Integer getSupersededByVersion() {
        return supersededByVersion;
    }

    public void setSupersededByVersion(Integer supersededByVersion) {
        this.supersededByVersion = supersededByVersion;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
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
