package com.etrm.system.trader;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** V99. Per-commodity override of a trader's flat daily/single/position limits. */
@Entity
@Table(name = "trader_commodity_limit")
public class TraderCommodityLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trader_commodity_limit_id")
    private Integer traderCommodityLimitId;

    // V128 — optimistic locking (see LegalEntity.rowVersion doc comment).
    // TraderService.saveCommodityLimits deletes and recreates every limit
    // row wholesale on each trader save (never an individual row update),
    // so there's no real stale-write scenario to protect here; added purely
    // for schema consistency with the rest of this batch.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "trader_id", nullable = false)
    private Integer traderId;

    // FK -> dbo.commodity_type(commodity_type_id) (V85).
    @NotNull
    @Column(name = "commodity_type", nullable = false)
    private Integer commodityType;

    @Column(name = "daily_trade_limit")
    private BigDecimal dailyTradeLimit;

    @Column(name = "single_trade_limit")
    private BigDecimal singleTradeLimit;

    @Column(name = "position_limit")
    private BigDecimal positionLimit;

    public Integer getTraderCommodityLimitId() {
        return traderCommodityLimitId;
    }

    public void setTraderCommodityLimitId(Integer traderCommodityLimitId) {
        this.traderCommodityLimitId = traderCommodityLimitId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getTraderId() {
        return traderId;
    }

    public void setTraderId(Integer traderId) {
        this.traderId = traderId;
    }

    public Integer getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(Integer commodityType) {
        this.commodityType = commodityType;
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
}
