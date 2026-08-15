package com.etrm.system.period;

import com.etrm.system.common.SourceSystemDefaults;
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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * V162 — full redesign. market_product_link_id replaces commodity_type as
 * the key: dbo.market_product_link already pairs market_id + product_id, so
 * one FK encodes "which market AND which product" a period belongs to,
 * matching real exchange practice (every contract month's lifecycle dates
 * differ by market as well as by product). period_id widened to BIGINT to
 * accommodate LME-style daily prompt-date curves (WEEK/DAY period_type),
 * which project a much higher row volume per market_product_link than
 * monthly-contract commodities. See
 * docs/period_fx_fold_product_link_pending_07.md for the full design
 * record. curve_label/notes remain deliberately unmapped to the frontend,
 * same as before V162.
 *
 * V163 — market_product renamed to market_product_link (the row is a link
 * record, not a product); this FK field/column followed.
 *
 * V170 — +priceIndexId/+fxIndexId. A published curve very often has a
 * separate value per listed period (e.g. "TTF Month+1" and "TTF Month+2"
 * are different price_index rows, not one flat "TTF" index), so the period
 * — not just the market_product_link it belongs to — is what resolves to a
 * specific price_index. fxIndexId mirrors trade_pricing_schedule's existing
 * fx_index_id (FX conversion series) at the period level, for a default FX
 * source without needing a trade-level override every time.
 */
@Entity
@Table(name = "ref_period")
@EntityListeners(AuditingEntityListener.class)
public class Period {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "period_id")
    private Long periodId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    // V163 — market_product renamed to market_product_link; this FK column
    // followed (market_product_id -> market_product_link_id).
    @NotNull
    @Column(name = "market_product_link_id", nullable = false)
    private Integer marketProductLinkId;

    // Display-only, resolved from market_product_id — see PeriodService.hydrate().
    @Transient
    @JsonProperty
    private String marketCode;

    @Transient
    @JsonProperty
    private String productCode;

    @NotBlank
    @Size(max = 30)
    @Column(name = "period_code", nullable = false, length = 30)
    private String periodCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "period_name", nullable = false, length = 200)
    private String periodName;

    @NotBlank
    @Column(name = "period_type", nullable = false, length = 20)
    private String periodType;

    @NotNull
    @Column(name = "is_rolling", nullable = false)
    private Boolean isRolling = false;

    // SMALLINT -> Short (Hibernate mapping rule used throughout this codebase).
    @Column(name = "roll_offset")
    private Short rollOffset;

    @Size(max = 10)
    @Column(name = "roll_unit", length = 10)
    private String rollUnit;

    @Column(name = "period_start")
    private LocalDate startDate;

    @Column(name = "period_end")
    private LocalDate endDate;

    @Column(name = "delivery_start_date")
    private LocalDate deliveryStartDate;

    @Column(name = "delivery_end_date")
    private LocalDate deliveryEndDate;

    @Column(name = "curve_label")
    private String curveLabel;

    @Column(name = "first_trade_date")
    private LocalDate firstTradeDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "last_trade_date")
    private LocalDate lastTradeDate;

    @Column(name = "option_exp_date")
    private LocalDate optionExpDate;

    @Column(name = "settlement_date")
    private LocalDate settlementDate;

    @Column(name = "first_notice_date")
    private LocalDate firstNoticeDate;

    @Column(name = "last_notice_date")
    private LocalDate lastNoticeDate;

    @Size(max = 20)
    @Column(name = "pricing_calendar_code", length = 20)
    private String pricingCalendarCode;

    @Size(max = 20)
    @Column(name = "settlement_calendar_code", length = 20)
    private String settlementCalendarCode;

    @Column(name = "price_index_id")
    private Integer priceIndexId;

    @Column(name = "fx_index_id")
    private Integer fxIndexId;

    // FK -> dbo.lookup_value(lookup_id), category='load_type'.
    @Column(name = "load_type_lookup_id")
    private Integer loadTypeLookupId;

    @Transient
    private String loadType;

    // FK -> dbo.lookup_value(lookup_id), category='gas_day_type'.
    @Column(name = "gas_day_type_lookup_id")
    private Integer gasDayTypeLookupId;

    @Transient
    private String gasDayType;

    @Column(name = "start_time_utc")
    private LocalTime startTimeUtc;

    @Column(name = "end_time_utc")
    private LocalTime endTimeUtc;

    // TINYINT -> Short.
    @Column(name = "crop_year_offset_months")
    private Short cropYearOffsetMonths;

    @NotBlank
    @Column(name = "status_code", nullable = false, length = 20)
    private String statusCode = "OPEN";

    @NotNull
    @Column(name = "is_trading_period", nullable = false)
    private Boolean isTradingPeriod = false;

    @NotNull
    @Column(name = "is_risk_period", nullable = false)
    private Boolean isRiskPeriod = false;

    @NotNull
    @Column(name = "is_settlement_period", nullable = false)
    private Boolean isSettlementPeriod = false;

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

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    private void stampSourceSystemOnCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    private void stampSourceSystemOnUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Long getPeriodId() {
        return periodId;
    }

    public void setPeriodId(Long periodId) {
        this.periodId = periodId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getMarketProductLinkId() {
        return marketProductLinkId;
    }

    public void setMarketProductLinkId(Integer marketProductLinkId) {
        this.marketProductLinkId = marketProductLinkId;
    }

    public String getMarketCode() {
        return marketCode;
    }

    public void setMarketCode(String marketCode) {
        this.marketCode = marketCode;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
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

    public Boolean getIsRolling() {
        return isRolling;
    }

    public void setIsRolling(Boolean isRolling) {
        this.isRolling = isRolling;
    }

    public Short getRollOffset() {
        return rollOffset;
    }

    public void setRollOffset(Short rollOffset) {
        this.rollOffset = rollOffset;
    }

    public String getRollUnit() {
        return rollUnit;
    }

    public void setRollUnit(String rollUnit) {
        this.rollUnit = rollUnit;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
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

    public String getCurveLabel() {
        return curveLabel;
    }

    public void setCurveLabel(String curveLabel) {
        this.curveLabel = curveLabel;
    }

    public LocalDate getFirstTradeDate() {
        return firstTradeDate;
    }

    public void setFirstTradeDate(LocalDate firstTradeDate) {
        this.firstTradeDate = firstTradeDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public LocalDate getLastTradeDate() {
        return lastTradeDate;
    }

    public void setLastTradeDate(LocalDate lastTradeDate) {
        this.lastTradeDate = lastTradeDate;
    }

    public LocalDate getOptionExpDate() {
        return optionExpDate;
    }

    public void setOptionExpDate(LocalDate optionExpDate) {
        this.optionExpDate = optionExpDate;
    }

    public LocalDate getSettlementDate() {
        return settlementDate;
    }

    public void setSettlementDate(LocalDate settlementDate) {
        this.settlementDate = settlementDate;
    }

    public LocalDate getFirstNoticeDate() {
        return firstNoticeDate;
    }

    public void setFirstNoticeDate(LocalDate firstNoticeDate) {
        this.firstNoticeDate = firstNoticeDate;
    }

    public LocalDate getLastNoticeDate() {
        return lastNoticeDate;
    }

    public void setLastNoticeDate(LocalDate lastNoticeDate) {
        this.lastNoticeDate = lastNoticeDate;
    }

    public String getPricingCalendarCode() {
        return pricingCalendarCode;
    }

    public void setPricingCalendarCode(String pricingCalendarCode) {
        this.pricingCalendarCode = pricingCalendarCode;
    }

    public String getSettlementCalendarCode() {
        return settlementCalendarCode;
    }

    public void setSettlementCalendarCode(String settlementCalendarCode) {
        this.settlementCalendarCode = settlementCalendarCode;
    }

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public Integer getFxIndexId() {
        return fxIndexId;
    }

    public void setFxIndexId(Integer fxIndexId) {
        this.fxIndexId = fxIndexId;
    }

    public Integer getLoadTypeLookupId() {
        return loadTypeLookupId;
    }

    public void setLoadTypeLookupId(Integer loadTypeLookupId) {
        this.loadTypeLookupId = loadTypeLookupId;
    }

    @JsonProperty("loadType")
    public String getLoadType() {
        return loadType;
    }

    @JsonProperty("loadType")
    public void setLoadType(String loadType) {
        this.loadType = loadType;
    }

    public Integer getGasDayTypeLookupId() {
        return gasDayTypeLookupId;
    }

    public void setGasDayTypeLookupId(Integer gasDayTypeLookupId) {
        this.gasDayTypeLookupId = gasDayTypeLookupId;
    }

    @JsonProperty("gasDayType")
    public String getGasDayType() {
        return gasDayType;
    }

    @JsonProperty("gasDayType")
    public void setGasDayType(String gasDayType) {
        this.gasDayType = gasDayType;
    }

    public LocalTime getStartTimeUtc() {
        return startTimeUtc;
    }

    public void setStartTimeUtc(LocalTime startTimeUtc) {
        this.startTimeUtc = startTimeUtc;
    }

    public LocalTime getEndTimeUtc() {
        return endTimeUtc;
    }

    public void setEndTimeUtc(LocalTime endTimeUtc) {
        this.endTimeUtc = endTimeUtc;
    }

    public Short getCropYearOffsetMonths() {
        return cropYearOffsetMonths;
    }

    public void setCropYearOffsetMonths(Short cropYearOffsetMonths) {
        this.cropYearOffsetMonths = cropYearOffsetMonths;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public Boolean getIsTradingPeriod() {
        return isTradingPeriod;
    }

    public void setIsTradingPeriod(Boolean isTradingPeriod) {
        this.isTradingPeriod = isTradingPeriod;
    }

    public Boolean getIsRiskPeriod() {
        return isRiskPeriod;
    }

    public void setIsRiskPeriod(Boolean isRiskPeriod) {
        this.isRiskPeriod = isRiskPeriod;
    }

    public Boolean getIsSettlementPeriod() {
        return isSettlementPeriod;
    }

    public void setIsSettlementPeriod(Boolean isSettlementPeriod) {
        this.isSettlementPeriod = isSettlementPeriod;
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

    // Setter exists only so the service layer can copy the persisted value
    // back onto the incoming update payload — same convention as setCreatedBy.
    public void setCreatedSrcId(Short createdSrcId) {
        this.createdSrcId = createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
