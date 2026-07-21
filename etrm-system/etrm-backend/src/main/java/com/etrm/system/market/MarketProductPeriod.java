package com.etrm.system.market;

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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * The frontend's MarketProductPeriod type is much smaller than this table
 * (mppId/marketProductId/periodId/periodCode/periodName/periodType/
 * curveLabel/isActive only) — the various trading-date/offset columns
 * below are mapped for completeness (a future date-calculation feature
 * would need them) but are not read or written by the current UI, which
 * only ever calls addPeriod(marketProductId, periodId).
 *
 * V147 — added created_at/created_by/updated_at/updated_by (previously
 * completely missing) as @CreatedDate/@CreatedBy/@LastModifiedDate/
 * @LastModifiedBy JPA-auditing fields.
 */
@Entity
@Table(name = "market_product_period")
@EntityListeners(AuditingEntityListener.class)
public class MarketProductPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mpp_id")
    private Integer mppId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "market_product_id", nullable = false)
    private Integer marketProductId;

    @NotNull
    @Column(name = "period_id", nullable = false)
    private Integer periodId;

    @Transient
    @JsonProperty
    private String periodCode;

    @Transient
    @JsonProperty
    private String periodName;

    @Transient
    @JsonProperty
    private String periodType;

    @Transient
    @JsonProperty
    private String curveLabel;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 200)
    @Column(name = "notes", length = 200)
    private String notes;

    @Column(name = "last_trading_date")
    private LocalDate lastTradingDate;

    @Column(name = "first_notice_date")
    private LocalDate firstNoticeDate;

    @Column(name = "settlement_price_date")
    private LocalDate settlementPriceDate;

    @Column(name = "delivery_start_date")
    private LocalDate deliveryStartDate;

    @Column(name = "delivery_end_date")
    private LocalDate deliveryEndDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "cash_settlement_date")
    private LocalDate cashSettlementDate;

    @Column(name = "ltd_offset_days")
    private Short ltdOffsetDays;

    @Size(max = 10)
    @Column(name = "ltd_offset_type", length = 10)
    private String ltdOffsetType;

    @Column(name = "fnd_offset_days")
    private Short fndOffsetDays;

    @Size(max = 10)
    @Column(name = "fnd_offset_type", length = 10)
    private String fndOffsetType;

    @Column(name = "settlement_offset_days")
    private Short settlementOffsetDays;

    @Size(max = 10)
    @Column(name = "settlement_offset_type", length = 10)
    private String settlementOffsetType;

    @Column(name = "offset_calendar_id")
    private Integer offsetCalendarId;

    @Size(max = 50)
    @Column(name = "ltd_reference_date_rule", length = 50)
    private String ltdReferenceDateRule;

    @Column(name = "dates_populated_at")
    private LocalDateTime datesPopulatedAt;

    @Size(max = 100)
    @Column(name = "dates_populated_by", length = 100)
    private String datesPopulatedBy;

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

    public Integer getMppId() {
        return mppId;
    }

    public void setMppId(Integer mppId) {
        this.mppId = mppId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getMarketProductId() {
        return marketProductId;
    }

    public void setMarketProductId(Integer marketProductId) {
        this.marketProductId = marketProductId;
    }

    public Integer getPeriodId() {
        return periodId;
    }

    public void setPeriodId(Integer periodId) {
        this.periodId = periodId;
    }

    public String getPeriodCode() {
        return periodCode;
    }

    public void setPeriodCode(String periodCode) {
        this.periodCode = periodCode;
    }

    public String getPeriodName() {
        return periodName;
    }

    public void setPeriodName(String periodName) {
        this.periodName = periodName;
    }

    public String getPeriodType() {
        return periodType;
    }

    public void setPeriodType(String periodType) {
        this.periodType = periodType;
    }

    public String getCurveLabel() {
        return curveLabel;
    }

    public void setCurveLabel(String curveLabel) {
        this.curveLabel = curveLabel;
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

    public LocalDate getLastTradingDate() {
        return lastTradingDate;
    }

    public void setLastTradingDate(LocalDate lastTradingDate) {
        this.lastTradingDate = lastTradingDate;
    }

    public LocalDate getFirstNoticeDate() {
        return firstNoticeDate;
    }

    public void setFirstNoticeDate(LocalDate firstNoticeDate) {
        this.firstNoticeDate = firstNoticeDate;
    }

    public LocalDate getSettlementPriceDate() {
        return settlementPriceDate;
    }

    public void setSettlementPriceDate(LocalDate settlementPriceDate) {
        this.settlementPriceDate = settlementPriceDate;
    }

    public LocalDate getDeliveryStartDate() {
        return deliveryStartDate;
    }

    public void setDeliveryStartDate(LocalDate deliveryStartDate) {
        this.deliveryStartDate = deliveryStartDate;
    }

    public LocalDate getDeliveryEndDate() {
        return deliveryEndDate;
    }

    public void setDeliveryEndDate(LocalDate deliveryEndDate) {
        this.deliveryEndDate = deliveryEndDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public LocalDate getCashSettlementDate() {
        return cashSettlementDate;
    }

    public void setCashSettlementDate(LocalDate cashSettlementDate) {
        this.cashSettlementDate = cashSettlementDate;
    }

    public Short getLtdOffsetDays() {
        return ltdOffsetDays;
    }

    public void setLtdOffsetDays(Short ltdOffsetDays) {
        this.ltdOffsetDays = ltdOffsetDays;
    }

    public String getLtdOffsetType() {
        return ltdOffsetType;
    }

    public void setLtdOffsetType(String ltdOffsetType) {
        this.ltdOffsetType = ltdOffsetType;
    }

    public Short getFndOffsetDays() {
        return fndOffsetDays;
    }

    public void setFndOffsetDays(Short fndOffsetDays) {
        this.fndOffsetDays = fndOffsetDays;
    }

    public String getFndOffsetType() {
        return fndOffsetType;
    }

    public void setFndOffsetType(String fndOffsetType) {
        this.fndOffsetType = fndOffsetType;
    }

    public Short getSettlementOffsetDays() {
        return settlementOffsetDays;
    }

    public void setSettlementOffsetDays(Short settlementOffsetDays) {
        this.settlementOffsetDays = settlementOffsetDays;
    }

    public String getSettlementOffsetType() {
        return settlementOffsetType;
    }

    public void setSettlementOffsetType(String settlementOffsetType) {
        this.settlementOffsetType = settlementOffsetType;
    }

    public Integer getOffsetCalendarId() {
        return offsetCalendarId;
    }

    public void setOffsetCalendarId(Integer offsetCalendarId) {
        this.offsetCalendarId = offsetCalendarId;
    }

    public String getLtdReferenceDateRule() {
        return ltdReferenceDateRule;
    }

    public void setLtdReferenceDateRule(String ltdReferenceDateRule) {
        this.ltdReferenceDateRule = ltdReferenceDateRule;
    }

    public LocalDateTime getDatesPopulatedAt() {
        return datesPopulatedAt;
    }

    public void setDatesPopulatedAt(LocalDateTime datesPopulatedAt) {
        this.datesPopulatedAt = datesPopulatedAt;
    }

    public String getDatesPopulatedBy() {
        return datesPopulatedBy;
    }

    public void setDatesPopulatedBy(String datesPopulatedBy) {
        this.datesPopulatedBy = datesPopulatedBy;
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
