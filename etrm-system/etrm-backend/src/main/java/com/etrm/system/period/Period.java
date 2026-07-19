package com.etrm.system.period;

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
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * dbo.period only has created_at/created_by — NOT the full AuditableEntity
 * 4-column set, confirmed directly against the live schema's sys.columns
 * (there is no updated_at/updated_by on this table at all, unlike most other
 * master data tables). An earlier version of this comment claimed
 * created_at-only and left created_by completely unmapped, which made every
 * create() 100% fail with a NOT NULL violation on created_by — fixed by
 * mapping it here with the same @CreatedBy/@CreatedDate JPA-auditing
 * annotations AuditableEntity uses, just without extending it (that
 * superclass assumes all 4 columns exist). commodity_type FKs the dedicated
 * dbo.commodity_type table (V85), NOT lookup_value — see Book.java's doc
 * comment for the full V55-vs-V85 story. load_type/gas_day_type genuinely DO
 * FK lookup_value (V57, never redirected by V85 — only book_type/
 * commodity_type were "the exception"). curve_label/notes columns exist in
 * the DB but have no frontend field — deliberately left unmapped, matching
 * the app's convention of not mapping unused columns.
 */
@Entity
@Table(name = "period")
@EntityListeners(AuditingEntityListener.class)
public class Period {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "period_id")
    private Integer periodId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

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

    // SMALLINT -> Short, not Integer (see the major-session JPA-vs-schema
    // audit's finding: Hibernate maps Short to SMALLINT, never Integer).
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

    @Size(max = 20)
    @Column(name = "pricing_calendar_code", length = 20)
    private String pricingCalendarCode;

    @Size(max = 20)
    @Column(name = "settlement_calendar_code", length = 20)
    private String settlementCalendarCode;

    // FK -> dbo.commodity_type(commodity_type_id). Frontend sends/receives
    // the type_code string ("OIL") — see PeriodService's translation.
    @Column(name = "commodity_type")
    private Integer commodityTypeId;

    @Transient
    private String commodityType;

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

    // TINYINT -> Short, not Integer (same Hibernate mapping rule as roll_offset above).
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

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getPeriodId() {
        return periodId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public Integer getCommodityTypeId() {
        return commodityTypeId;
    }

    public void setCommodityTypeId(Integer commodityTypeId) {
        this.commodityTypeId = commodityTypeId;
    }

    @JsonProperty("commodityType")
    public String getCommodityType() {
        return commodityType;
    }

    @JsonProperty("commodityType")
    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
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
