package com.etrm.system.market;

import com.etrm.system.common.AuditableEntity;
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

import java.time.LocalDate;

/** commodity_id resolves to the frontend's plain commodityType string via CommodityTypeMapping — see PriceIndex.java's doc comment. */
@Entity
@Table(name = "market")
public class Market extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_id")
    private Integer marketId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "exchange_id")
    private Integer exchangeId;

    @Transient
    @JsonProperty
    private String exchangeCode;

    @Column(name = "commodity_id")
    private Integer commodityId;

    @Transient
    private String commodityType;

    @NotBlank
    @Size(max = 30)
    @Column(name = "market_code", nullable = false, length = 30)
    private String marketCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "market_name", nullable = false, length = 200)
    private String marketName;

    @NotBlank
    @Column(name = "market_type", nullable = false, length = 20)
    private String marketType;

    @NotBlank
    @Column(name = "settlement_type", nullable = false, length = 20)
    private String settlementType;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotBlank
    @Size(max = 50)
    @Column(name = "timezone", nullable = false, length = 50)
    private String timezone;

    // V165 — country_id dropped (redundant with dbo.exchange.country_id for
    // EXCHANGE-type markets, the only case exchange_id is populated);
    // contract_size/tick_size dropped (redundant with V161's
    // derivative_contract_specification, scoped per instrument, and
    // market_product_link.lot_size, scoped per listing); clearing_house
    // (free-text VARCHAR) replaced by clearing_house_id — a CCP is a real
    // legal entity (credit/membership exposure), modeled via dbo.counterparty
    // (new CLEARING_HOUSE counterparty_type) rather than a bespoke master
    // table. Stays on market rather than moving to exchange: OTC_CLEARED
    // markets have no exchange_id at all, so this is the only place a CCP
    // fact can live for them. V166 — contract_uom_id also dropped: its only
    // purpose was describing contract_size, orphaned once that was dropped.
    @Column(name = "clearing_house_id")
    private Integer clearingHouseId;

    @Transient
    @JsonProperty
    private String clearingHouseName;

    @Size(max = 100)
    @Column(name = "price_quotation", length = 100)
    private String priceQuotation;

    @Column(name = "go_live_date")
    private LocalDate goLiveDate;

    @Column(name = "close_date")
    private LocalDate closeDate;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getMarketId() {
        return marketId;
    }

    public void setMarketId(Integer marketId) {
        this.marketId = marketId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getExchangeId() {
        return exchangeId;
    }

    public void setExchangeId(Integer exchangeId) {
        this.exchangeId = exchangeId;
    }

    public String getExchangeCode() {
        return exchangeCode;
    }

    public void setExchangeCode(String exchangeCode) {
        this.exchangeCode = exchangeCode;
    }

    public Integer getCommodityId() {
        return commodityId;
    }

    public void setCommodityId(Integer commodityId) {
        this.commodityId = commodityId;
    }

    @JsonProperty("commodityType")
    public String getCommodityType() {
        return commodityType;
    }

    @JsonProperty("commodityType")
    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public String getMarketCode() {
        return marketCode;
    }

    public void setMarketCode(String marketCode) {
        this.marketCode = marketCode;
    }

    public String getMarketName() {
        return marketName;
    }

    public void setMarketName(String marketName) {
        this.marketName = marketName;
    }

    public String getMarketType() {
        return marketType;
    }

    public void setMarketType(String marketType) {
        this.marketType = marketType;
    }

    public String getSettlementType() {
        return settlementType;
    }

    public void setSettlementType(String settlementType) {
        this.settlementType = settlementType;
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

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Integer getClearingHouseId() {
        return clearingHouseId;
    }

    public void setClearingHouseId(Integer clearingHouseId) {
        this.clearingHouseId = clearingHouseId;
    }

    public String getClearingHouseName() {
        return clearingHouseName;
    }

    public void setClearingHouseName(String clearingHouseName) {
        this.clearingHouseName = clearingHouseName;
    }

    public String getPriceQuotation() {
        return priceQuotation;
    }

    public void setPriceQuotation(String priceQuotation) {
        this.priceQuotation = priceQuotation;
    }

    public LocalDate getGoLiveDate() {
        return goLiveDate;
    }

    public void setGoLiveDate(LocalDate goLiveDate) {
        this.goLiveDate = goLiveDate;
    }

    public LocalDate getCloseDate() {
        return closeDate;
    }

    public void setCloseDate(LocalDate closeDate) {
        this.closeDate = closeDate;
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
}
