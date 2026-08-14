package com.etrm.system.marginvaluation;

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
 * dbo.margin_valuation (V206) — the daily/intraday EOD margin computation
 * and FCM-statement-reconciliation run, per clearing_account. Distinct
 * from dbo.margin_call: this is the account-wide calculation that produces
 * the numbers a call gets issued from (gross/net IM, spread offset
 * discount, VM P&L, FCM ledger balances, reconciliation status).
 */
@Entity
@Table(name = "tran_margin_valuation")
@EntityListeners(AuditingEntityListener.class)
public class MarginValuation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "margin_valuation_id")
    private Long marginValuationId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "clearing_account_id", nullable = false)
    private Integer clearingAccountId;

    @Transient
    @JsonProperty
    private String clearingAccountCode;

    @NotNull
    @Column(name = "valuation_date", nullable = false)
    private LocalDate valuationDate;

    @NotNull
    @Column(name = "run_type", nullable = false, length = 20)
    private String runType;

    @NotNull
    @Column(name = "total_open_lots", nullable = false)
    private BigDecimal totalOpenLots;

    @Column(name = "total_open_volume")
    private BigDecimal totalOpenVolume;

    @Column(name = "volume_uom_id")
    private Integer volumeUomId;

    @Transient
    @JsonProperty
    private String volumeUomCode;

    @NotNull
    @Column(name = "gross_initial_margin", nullable = false)
    private BigDecimal grossInitialMargin;

    @NotNull
    @Column(name = "spread_offset_discount", nullable = false)
    private BigDecimal spreadOffsetDiscount;

    @NotNull
    @Column(name = "net_required_im", nullable = false)
    private BigDecimal netRequiredIm;

    @NotNull
    @Column(name = "variation_margin_pnl", nullable = false)
    private BigDecimal variationMarginPnl;

    @NotNull
    @Column(name = "option_premium_amount", nullable = false)
    private BigDecimal optionPremiumAmount;

    @NotNull
    @Column(name = "fcm_cash_balance", nullable = false)
    private BigDecimal fcmCashBalance;

    @NotNull
    @Column(name = "fcm_collateral_noncash", nullable = false)
    private BigDecimal fcmCollateralNoncash;

    @NotNull
    @Column(name = "fx_rate_to_account_base", nullable = false)
    private BigDecimal fxRateToAccountBase;

    @NotNull
    @Column(name = "net_margin_call_amount", nullable = false)
    private BigDecimal netMarginCallAmount;

    @NotNull
    @Column(name = "discrepancy_with_fcm", nullable = false)
    private BigDecimal discrepancyWithFcm;

    @NotNull
    @Column(name = "reconciliation_status", nullable = false, length = 20)
    private String reconciliationStatus;

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

    public Long getMarginValuationId() { return marginValuationId; }
    public void setMarginValuationId(Long marginValuationId) { this.marginValuationId = marginValuationId; }

    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }

    public Integer getClearingAccountId() { return clearingAccountId; }
    public void setClearingAccountId(Integer clearingAccountId) { this.clearingAccountId = clearingAccountId; }

    public String getClearingAccountCode() { return clearingAccountCode; }
    public void setClearingAccountCode(String clearingAccountCode) { this.clearingAccountCode = clearingAccountCode; }

    public LocalDate getValuationDate() { return valuationDate; }
    public void setValuationDate(LocalDate valuationDate) { this.valuationDate = valuationDate; }

    public String getRunType() { return runType; }
    public void setRunType(String runType) { this.runType = runType; }

    public BigDecimal getTotalOpenLots() { return totalOpenLots; }
    public void setTotalOpenLots(BigDecimal totalOpenLots) { this.totalOpenLots = totalOpenLots; }

    public BigDecimal getTotalOpenVolume() { return totalOpenVolume; }
    public void setTotalOpenVolume(BigDecimal totalOpenVolume) { this.totalOpenVolume = totalOpenVolume; }

    public Integer getVolumeUomId() { return volumeUomId; }
    public void setVolumeUomId(Integer volumeUomId) { this.volumeUomId = volumeUomId; }

    public String getVolumeUomCode() { return volumeUomCode; }
    public void setVolumeUomCode(String volumeUomCode) { this.volumeUomCode = volumeUomCode; }

    public BigDecimal getGrossInitialMargin() { return grossInitialMargin; }
    public void setGrossInitialMargin(BigDecimal grossInitialMargin) { this.grossInitialMargin = grossInitialMargin; }

    public BigDecimal getSpreadOffsetDiscount() { return spreadOffsetDiscount; }
    public void setSpreadOffsetDiscount(BigDecimal spreadOffsetDiscount) { this.spreadOffsetDiscount = spreadOffsetDiscount; }

    public BigDecimal getNetRequiredIm() { return netRequiredIm; }
    public void setNetRequiredIm(BigDecimal netRequiredIm) { this.netRequiredIm = netRequiredIm; }

    public BigDecimal getVariationMarginPnl() { return variationMarginPnl; }
    public void setVariationMarginPnl(BigDecimal variationMarginPnl) { this.variationMarginPnl = variationMarginPnl; }

    public BigDecimal getOptionPremiumAmount() { return optionPremiumAmount; }
    public void setOptionPremiumAmount(BigDecimal optionPremiumAmount) { this.optionPremiumAmount = optionPremiumAmount; }

    public BigDecimal getFcmCashBalance() { return fcmCashBalance; }
    public void setFcmCashBalance(BigDecimal fcmCashBalance) { this.fcmCashBalance = fcmCashBalance; }

    public BigDecimal getFcmCollateralNoncash() { return fcmCollateralNoncash; }
    public void setFcmCollateralNoncash(BigDecimal fcmCollateralNoncash) { this.fcmCollateralNoncash = fcmCollateralNoncash; }

    public BigDecimal getFxRateToAccountBase() { return fxRateToAccountBase; }
    public void setFxRateToAccountBase(BigDecimal fxRateToAccountBase) { this.fxRateToAccountBase = fxRateToAccountBase; }

    public BigDecimal getNetMarginCallAmount() { return netMarginCallAmount; }
    public void setNetMarginCallAmount(BigDecimal netMarginCallAmount) { this.netMarginCallAmount = netMarginCallAmount; }

    public BigDecimal getDiscrepancyWithFcm() { return discrepancyWithFcm; }
    public void setDiscrepancyWithFcm(BigDecimal discrepancyWithFcm) { this.discrepancyWithFcm = discrepancyWithFcm; }

    public String getReconciliationStatus() { return reconciliationStatus; }
    public void setReconciliationStatus(String reconciliationStatus) { this.reconciliationStatus = reconciliationStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Short getCreatedSrcId() { return createdSrcId; }
    public void setCreatedSrcId(Short createdSrcId) { this.createdSrcId = createdSrcId; }

    public Short getUpdatedSrcId() { return updatedSrcId; }
    public void setUpdatedSrcId(Short updatedSrcId) { this.updatedSrcId = updatedSrcId; }
}
