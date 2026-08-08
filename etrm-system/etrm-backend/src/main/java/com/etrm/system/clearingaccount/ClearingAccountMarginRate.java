package com.etrm.system.clearingaccount;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.etrm.system.common.SourceSystemDefaults;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.clearing_account_margin_rate (V208) — the FCM's house margin rate
 * (markup over dbo.contract_margin_rate's exchange-published rate) per
 * clearing_account per derivative contract spec. Managed inline as a tab on
 * the Clearing Account page, not a standalone Tier2 screen — filtered by
 * clearing_account_id server-side (see ClearingAccountMarginRateController),
 * not through the generic Tier2 reference-data mechanism, which has no
 * server-side filtering and would force a full-table client-side scan.
 */
@Entity
@Table(name = "clearing_account_margin_rate")
@EntityListeners(AuditingEntityListener.class)
public class ClearingAccountMarginRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clearing_account_margin_rate_id")
    private Integer clearingAccountMarginRateId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "clearing_account_id", nullable = false)
    private Integer clearingAccountId;

    @NotNull
    @Column(name = "contract_spec_id", nullable = false)
    private Integer contractSpecId;

    @Transient
    @JsonProperty
    private String contractSpecCode;

    @NotNull
    @Column(name = "tenor_bucket", nullable = false, length = 20)
    private String tenorBucket;

    @NotNull
    @Column(name = "margin_unit_type", nullable = false, length = 20)
    private String marginUnitType;

    @NotNull
    @Column(name = "house_initial_margin_rate", nullable = false)
    private BigDecimal houseInitialMarginRate;

    @NotNull
    @Column(name = "house_maintenance_margin_rate", nullable = false)
    private BigDecimal houseMaintenanceMarginRate;

    @NotNull
    @Column(name = "margin_currency_id", nullable = false)
    private Integer marginCurrencyId;

    @Transient
    @JsonProperty
    private String marginCurrencyCode;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @NotNull
    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent = true;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
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

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getClearingAccountMarginRateId() {
        return clearingAccountMarginRateId;
    }

    public void setClearingAccountMarginRateId(Integer clearingAccountMarginRateId) {
        this.clearingAccountMarginRateId = clearingAccountMarginRateId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getClearingAccountId() {
        return clearingAccountId;
    }

    public void setClearingAccountId(Integer clearingAccountId) {
        this.clearingAccountId = clearingAccountId;
    }

    public Integer getContractSpecId() {
        return contractSpecId;
    }

    public void setContractSpecId(Integer contractSpecId) {
        this.contractSpecId = contractSpecId;
    }

    public String getContractSpecCode() {
        return contractSpecCode;
    }

    public void setContractSpecCode(String contractSpecCode) {
        this.contractSpecCode = contractSpecCode;
    }

    public String getTenorBucket() {
        return tenorBucket;
    }

    public void setTenorBucket(String tenorBucket) {
        this.tenorBucket = tenorBucket;
    }

    public String getMarginUnitType() {
        return marginUnitType;
    }

    public void setMarginUnitType(String marginUnitType) {
        this.marginUnitType = marginUnitType;
    }

    public BigDecimal getHouseInitialMarginRate() {
        return houseInitialMarginRate;
    }

    public void setHouseInitialMarginRate(BigDecimal houseInitialMarginRate) {
        this.houseInitialMarginRate = houseInitialMarginRate;
    }

    public BigDecimal getHouseMaintenanceMarginRate() {
        return houseMaintenanceMarginRate;
    }

    public void setHouseMaintenanceMarginRate(BigDecimal houseMaintenanceMarginRate) {
        this.houseMaintenanceMarginRate = houseMaintenanceMarginRate;
    }

    public Integer getMarginCurrencyId() {
        return marginCurrencyId;
    }

    public void setMarginCurrencyId(Integer marginCurrencyId) {
        this.marginCurrencyId = marginCurrencyId;
    }

    public String getMarginCurrencyCode() {
        return marginCurrencyCode;
    }

    public void setMarginCurrencyCode(String marginCurrencyCode) {
        this.marginCurrencyCode = marginCurrencyCode;
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

    public Boolean getIsCurrent() {
        return isCurrent;
    }

    public void setIsCurrent(Boolean isCurrent) {
        this.isCurrent = isCurrent;
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

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public void setCreatedSrcId(Short createdSrcId) {
        this.createdSrcId = createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }

    public void setUpdatedSrcId(Short updatedSrcId) {
        this.updatedSrcId = updatedSrcId;
    }
}
