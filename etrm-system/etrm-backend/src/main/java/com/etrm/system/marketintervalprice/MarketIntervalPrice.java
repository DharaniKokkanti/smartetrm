package com.etrm.system.marketintervalprice;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * dbo.market_interval_price (V168) — sub-hourly settlement prices (5-min RT /
 * 15-min RT / hourly DA power today; named market-neutral since other
 * markets, e.g. gas balancing, will want the same shape later), one row per
 * priceIndexId per intervalStartUtc. Distinct from dbo.settlement_price (one
 * row per contract per DAY, for exchange-traded futures) — this table exists
 * because real-time power settlement doesn't fit a DATE-grained price at all.
 * priceIndexId points at a price_index row whose settlementIntervalType/
 * pnodeId/priceType (see PriceIndex.java) declare which node/granularity/
 * DA-or-RT series this row belongs to — priceType is NOT repeated here since
 * it's an attribute of the index, not the observation.
 */
@Entity
@Table(name = "market_interval_price")
@EntityListeners(AuditingEntityListener.class)
public class MarketIntervalPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_interval_price_id")
    private Long marketIntervalPriceId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "price_index_id", nullable = false)
    private Integer priceIndexId;

    @NotNull
    @Column(name = "interval_start_utc", nullable = false)
    private LocalDateTime intervalStartUtc;

    @NotNull
    @Column(name = "interval_minutes", nullable = false)
    private Short intervalMinutes;

    @NotNull
    @Column(name = "price", nullable = false, precision = 18, scale = 6)
    private BigDecimal price;

    @NotNull
    @Column(name = "is_confirmed", nullable = false)
    private Boolean isConfirmed = false;

    @Size(max = 100)
    @Column(name = "source", length = 100)
    private String source;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
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

    public Long getMarketIntervalPriceId() {
        return marketIntervalPriceId;
    }

    public void setMarketIntervalPriceId(Long marketIntervalPriceId) {
        this.marketIntervalPriceId = marketIntervalPriceId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public LocalDateTime getIntervalStartUtc() {
        return intervalStartUtc;
    }

    public void setIntervalStartUtc(LocalDateTime intervalStartUtc) {
        this.intervalStartUtc = intervalStartUtc;
    }

    public Short getIntervalMinutes() {
        return intervalMinutes;
    }

    public void setIntervalMinutes(Short intervalMinutes) {
        this.intervalMinutes = intervalMinutes;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Boolean getIsConfirmed() {
        return isConfirmed;
    }

    public void setIsConfirmed(Boolean isConfirmed) {
        this.isConfirmed = isConfirmed;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
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
}
