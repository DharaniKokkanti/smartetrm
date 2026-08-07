package com.etrm.system.trader;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * V99. Per-commodity override of a trader's flat daily/single/position
 * limits.
 *
 * V151 — added created_at/created_by/updated_at/updated_by. Every row is
 * deleted and recreated wholesale by TraderService.saveCommodityLimits on
 * each trader save (see rowVersion's own doc comment above), so there is no
 * existing-row value to preserve on "update" — JPA auditing always populates
 * these fresh on the recreate's insert, no service change needed.
 */
@Entity
@Table(name = "trader_commodity_limit")
@EntityListeners(AuditingEntityListener.class)
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
    protected void onCreateSrc() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    protected void onUpdateSrc() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

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

    public void setCreatedSrcId(Short createdSrcId) {
        this.createdSrcId = createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
