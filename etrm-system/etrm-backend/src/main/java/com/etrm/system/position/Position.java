package com.etrm.system.position;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * dbo.position is populated entirely by a batch calculation job (see
 * calculated_at/calculated_by columns) — this is a read-only reader, matching
 * the frontend's api.ts which only exposes a `list` method. legal_entity_id,
 * vessel_type, route_id, charter_party_type_id, calculation_type and
 * calculated_by are real columns on the table but are not part of the
 * frontend Position type, so they are intentionally not mapped here.
 */
@Entity
@Table(name = "position")
public class Position {

    @Id
    @Column(name = "position_id")
    private Integer positionId;

    @Column(name = "position_type", nullable = false, length = 20)
    private String positionType;

    @Column(name = "book_id", nullable = false)
    private Integer bookId;

    @Transient
    @JsonProperty
    private String bookCode;

    @Transient
    @JsonProperty
    private String bookName;

    @Column(name = "product_id")
    private Integer productId;

    @Transient
    @JsonProperty
    private String productCode;

    @Transient
    @JsonProperty
    private String productName;

    @Column(name = "commodity_type", nullable = false, length = 20)
    private String commodityType;

    @Column(name = "period_id")
    private Integer periodId;

    @Transient
    @JsonProperty
    private String periodCode;

    @Column(name = "net_quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal netQuantity;

    @Column(name = "gross_buy_quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal grossBuyQuantity;

    @Column(name = "gross_sell_quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal grossSellQuantity;

    @Column(name = "quantity_uom_id", nullable = false)
    private Integer quantityUomId;

    @Transient
    @JsonProperty
    private String quantityUomCode;

    @Column(name = "net_quantity_base", precision = 18, scale = 4)
    private BigDecimal netQuantityBase;

    @Column(name = "base_uom_code", length = 20)
    private String baseUomCode;

    @Column(name = "conversion_source", length = 30)
    private String conversionSource;

    @Column(name = "avg_price", precision = 18, scale = 6)
    private BigDecimal avgPrice;

    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @Column(name = "trade_count", nullable = false)
    private Integer tradeCount;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    public Integer getPositionId() {
        return positionId;
    }

    public void setPositionId(Integer positionId) {
        this.positionId = positionId;
    }

    public String getPositionType() {
        return positionType;
    }

    public void setPositionType(String positionType) {
        this.positionType = positionType;
    }

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public String getBookCode() {
        return bookCode;
    }

    public void setBookCode(String bookCode) {
        this.bookCode = bookCode;
    }

    public String getBookName() {
        return bookName;
    }

    public void setBookName(String bookName) {
        this.bookName = bookName;
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

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
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

    public BigDecimal getNetQuantity() {
        return netQuantity;
    }

    public void setNetQuantity(BigDecimal netQuantity) {
        this.netQuantity = netQuantity;
    }

    public BigDecimal getGrossBuyQuantity() {
        return grossBuyQuantity;
    }

    public void setGrossBuyQuantity(BigDecimal grossBuyQuantity) {
        this.grossBuyQuantity = grossBuyQuantity;
    }

    public BigDecimal getGrossSellQuantity() {
        return grossSellQuantity;
    }

    public void setGrossSellQuantity(BigDecimal grossSellQuantity) {
        this.grossSellQuantity = grossSellQuantity;
    }

    public Integer getQuantityUomId() {
        return quantityUomId;
    }

    public void setQuantityUomId(Integer quantityUomId) {
        this.quantityUomId = quantityUomId;
    }

    public String getQuantityUomCode() {
        return quantityUomCode;
    }

    public void setQuantityUomCode(String quantityUomCode) {
        this.quantityUomCode = quantityUomCode;
    }

    public BigDecimal getNetQuantityBase() {
        return netQuantityBase;
    }

    public void setNetQuantityBase(BigDecimal netQuantityBase) {
        this.netQuantityBase = netQuantityBase;
    }

    public String getBaseUomCode() {
        return baseUomCode;
    }

    public void setBaseUomCode(String baseUomCode) {
        this.baseUomCode = baseUomCode;
    }

    public String getConversionSource() {
        return conversionSource;
    }

    public void setConversionSource(String conversionSource) {
        this.conversionSource = conversionSource;
    }

    public BigDecimal getAvgPrice() {
        return avgPrice;
    }

    public void setAvgPrice(BigDecimal avgPrice) {
        this.avgPrice = avgPrice;
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

    public Integer getTradeCount() {
        return tradeCount;
    }

    public void setTradeCount(Integer tradeCount) {
        this.tradeCount = tradeCount;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
