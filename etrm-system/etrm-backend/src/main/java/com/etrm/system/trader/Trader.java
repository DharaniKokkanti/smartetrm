package com.etrm.system.trader;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "trader")
public class Trader extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trader_id")
    private Integer traderId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Transient
    @JsonProperty
    private String fullName;

    @Transient
    @JsonProperty
    private String email;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityCode;

    @Column(name = "desk_id")
    private Integer deskId;

    @Transient
    @JsonProperty
    private String deskCode;

    @Transient
    @JsonProperty
    private String deskName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "trader_code", nullable = false, length = 20)
    private String traderCode;

    // Raw CSV of lookup_value.code (category='commodity_type'), e.g. "OIL,GAS"
    // — never converted to an FK (V55 only converted the single-value
    // desk/book commodity_type columns, not this multi-value one). Frontend
    // gets/sends a List<Integer> of lookup ids — TraderService translates.
    @Column(name = "commodity_types", length = 200)
    private String commodityTypes;

    @Transient
    private List<Integer> commodityTypeIds;

    @Transient
    private List<TraderCommodityLimit> commodityLimits;

    @Column(name = "daily_trade_limit")
    private BigDecimal dailyTradeLimit;

    @Column(name = "single_trade_limit")
    private BigDecimal singleTradeLimit;

    @Column(name = "position_limit")
    private BigDecimal positionLimit;

    @Column(name = "approver_trader_id")
    private Integer approverTraderId;

    @Transient
    @JsonProperty
    private String approverName;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "go_live_date")
    private LocalDate goLiveDate;

    @Column(name = "deactivated_date")
    private LocalDate deactivatedDate;

    @NotNull
    @Column(name = "limit_currency_id", nullable = false)
    private Integer limitCurrencyId;

    public Integer getTraderId() {
        return traderId;
    }

    public void setTraderId(Integer traderId) {
        this.traderId = traderId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getLegalEntityCode() {
        return legalEntityCode;
    }

    public void setLegalEntityCode(String legalEntityCode) {
        this.legalEntityCode = legalEntityCode;
    }

    public Integer getDeskId() {
        return deskId;
    }

    public void setDeskId(Integer deskId) {
        this.deskId = deskId;
    }

    public String getDeskCode() {
        return deskCode;
    }

    public void setDeskCode(String deskCode) {
        this.deskCode = deskCode;
    }

    public String getDeskName() {
        return deskName;
    }

    public void setDeskName(String deskName) {
        this.deskName = deskName;
    }

    public String getTraderCode() {
        return traderCode;
    }

    public void setTraderCode(String traderCode) {
        this.traderCode = traderCode;
    }

    // Not exposed to JSON directly — commodityTypeIds is the wire shape (see below).
    public String getCommodityTypesCsv() {
        return commodityTypes;
    }

    public void setCommodityTypesCsv(String commodityTypes) {
        this.commodityTypes = commodityTypes;
    }

    @JsonProperty("commodityTypes")
    public List<Integer> getCommodityTypeIds() {
        return commodityTypeIds;
    }

    @JsonProperty("commodityTypes")
    public void setCommodityTypeIds(List<Integer> commodityTypeIds) {
        this.commodityTypeIds = commodityTypeIds;
    }

    @JsonProperty("commodityLimits")
    public List<TraderCommodityLimit> getCommodityLimits() {
        return commodityLimits;
    }

    @JsonProperty("commodityLimits")
    public void setCommodityLimits(List<TraderCommodityLimit> commodityLimits) {
        this.commodityLimits = commodityLimits;
    }

    public BigDecimal getDailyTradeLimit() {
        return dailyTradeLimit;
    }

    public void setDailyTradeLimit(BigDecimal dailyTradeLimit) {
        this.dailyTradeLimit = dailyTradeLimit;
    }

    public BigDecimal getSingleTradeLimit() {
        return singleTradeLimit;
    }

    public void setSingleTradeLimit(BigDecimal singleTradeLimit) {
        this.singleTradeLimit = singleTradeLimit;
    }

    public BigDecimal getPositionLimit() {
        return positionLimit;
    }

    public void setPositionLimit(BigDecimal positionLimit) {
        this.positionLimit = positionLimit;
    }

    public Integer getApproverTraderId() {
        return approverTraderId;
    }

    public void setApproverTraderId(Integer approverTraderId) {
        this.approverTraderId = approverTraderId;
    }

    public String getApproverName() {
        return approverName;
    }

    public void setApproverName(String approverName) {
        this.approverName = approverName;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDate getGoLiveDate() {
        return goLiveDate;
    }

    public void setGoLiveDate(LocalDate goLiveDate) {
        this.goLiveDate = goLiveDate;
    }

    public LocalDate getDeactivatedDate() {
        return deactivatedDate;
    }

    public void setDeactivatedDate(LocalDate deactivatedDate) {
        this.deactivatedDate = deactivatedDate;
    }

    public Integer getLimitCurrencyId() {
        return limitCurrencyId;
    }

    public void setLimitCurrencyId(Integer limitCurrencyId) {
        this.limitCurrencyId = limitCurrencyId;
    }
}
