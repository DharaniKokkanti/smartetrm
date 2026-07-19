package com.etrm.system.market;

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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "market_product")
public class MarketProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_product_id")
    private Integer marketProductId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "market_id", nullable = false)
    private Integer marketId;

    @NotNull
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Transient
    @JsonProperty
    private String productCode;

    @Transient
    @JsonProperty
    private String productName;

    @Size(max = 50)
    @Column(name = "ticker", length = 50)
    private String ticker;

    @Column(name = "currency_id")
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @Column(name = "uom_id")
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @Column(name = "lot_size")
    private BigDecimal lotSize;

    @Column(name = "min_quantity")
    private BigDecimal minQuantity;

    @Column(name = "max_quantity")
    private BigDecimal maxQuantity;

    // TINYINT -> Short.
    @Column(name = "price_precision")
    private Short pricePrecision;

    @Size(max = 20)
    @Column(name = "settlement_type", length = 20)
    private String settlementType;

    // SMALLINT -> Short.
    @Column(name = "first_notice_day_offset")
    private Short firstNoticeDayOffset;

    @Column(name = "last_trading_day_offset")
    private Short lastTradingDayOffset;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "listed_date")
    private LocalDate listedDate;

    @Column(name = "delisted_date")
    private LocalDate delistedDate;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getMarketProductId() {
        return marketProductId;
    }

    public void setMarketProductId(Integer marketProductId) {
        this.marketProductId = marketProductId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getMarketId() {
        return marketId;
    }

    public void setMarketId(Integer marketId) {
        this.marketId = marketId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getTicker() {
        return ticker;
    }

    public void setTicker(String ticker) {
        this.ticker = ticker;
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

    public Integer getUomId() {
        return uomId;
    }

    public void setUomId(Integer uomId) {
        this.uomId = uomId;
    }

    public String getUomCode() {
        return uomCode;
    }

    public void setUomCode(String uomCode) {
        this.uomCode = uomCode;
    }

    public BigDecimal getLotSize() {
        return lotSize;
    }

    public void setLotSize(BigDecimal lotSize) {
        this.lotSize = lotSize;
    }

    public BigDecimal getMinQuantity() {
        return minQuantity;
    }

    public void setMinQuantity(BigDecimal minQuantity) {
        this.minQuantity = minQuantity;
    }

    public BigDecimal getMaxQuantity() {
        return maxQuantity;
    }

    public void setMaxQuantity(BigDecimal maxQuantity) {
        this.maxQuantity = maxQuantity;
    }

    public Short getPricePrecision() {
        return pricePrecision;
    }

    public void setPricePrecision(Short pricePrecision) {
        this.pricePrecision = pricePrecision;
    }

    public String getSettlementType() {
        return settlementType;
    }

    public void setSettlementType(String settlementType) {
        this.settlementType = settlementType;
    }

    public Short getFirstNoticeDayOffset() {
        return firstNoticeDayOffset;
    }

    public void setFirstNoticeDayOffset(Short firstNoticeDayOffset) {
        this.firstNoticeDayOffset = firstNoticeDayOffset;
    }

    public Short getLastTradingDayOffset() {
        return lastTradingDayOffset;
    }

    public void setLastTradingDayOffset(Short lastTradingDayOffset) {
        this.lastTradingDayOffset = lastTradingDayOffset;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDate getListedDate() {
        return listedDate;
    }

    public void setListedDate(LocalDate listedDate) {
        this.listedDate = listedDate;
    }

    public LocalDate getDelistedDate() {
        return delistedDate;
    }

    public void setDelistedDate(LocalDate delistedDate) {
        this.delistedDate = delistedDate;
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
