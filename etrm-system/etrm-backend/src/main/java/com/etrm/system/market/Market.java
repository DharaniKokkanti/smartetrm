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

import java.math.BigDecimal;
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

    @Column(name = "country_id")
    private Integer countryId;

    @Size(max = 100)
    @Column(name = "clearing_house", length = 100)
    private String clearingHouse;

    @Column(name = "contract_size")
    private BigDecimal contractSize;

    @Column(name = "contract_uom_id")
    private Integer contractUomId;

    @Transient
    @JsonProperty
    private String contractUomCode;

    @Size(max = 100)
    @Column(name = "price_quotation", length = 100)
    private String priceQuotation;

    @Column(name = "tick_size")
    private BigDecimal tickSize;

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

    public Integer getCountryId() {
        return countryId;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }

    public String getClearingHouse() {
        return clearingHouse;
    }

    public void setClearingHouse(String clearingHouse) {
        this.clearingHouse = clearingHouse;
    }

    public BigDecimal getContractSize() {
        return contractSize;
    }

    public void setContractSize(BigDecimal contractSize) {
        this.contractSize = contractSize;
    }

    public Integer getContractUomId() {
        return contractUomId;
    }

    public void setContractUomId(Integer contractUomId) {
        this.contractUomId = contractUomId;
    }

    public String getContractUomCode() {
        return contractUomCode;
    }

    public void setContractUomCode(String contractUomCode) {
        this.contractUomCode = contractUomCode;
    }

    public String getPriceQuotation() {
        return priceQuotation;
    }

    public void setPriceQuotation(String priceQuotation) {
        this.priceQuotation = priceQuotation;
    }

    public BigDecimal getTickSize() {
        return tickSize;
    }

    public void setTickSize(BigDecimal tickSize) {
        this.tickSize = tickSize;
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
