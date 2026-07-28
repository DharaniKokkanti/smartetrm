package com.etrm.system.settlementprice;

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
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.settlement_price has created_at/updated_at only — NO created_by/
 * updated_by columns at all (unlike most master data tables), and NO
 * is_active column either (there is no deactivate concept here, only
 * is_confirmed via the /confirm endpoint). exchange and source are plain
 * CHECK-constrained nvarchar strings, not FKs. uom_id -> unit_of_measure
 * and tick_currency_id -> currency are real FKs; only uomCode is hydrated
 * for display per the frontend's SettlementPrice type (no currency code
 * field requested).
 *
 * V169 — this table is now the single store for all non-power/gas prices
 * (power/gas sub-hourly stays on MarketIntervalPrice, built for a different
 * grain): contractTicker+exchange populated (priceIndexId null) means
 * exchange futures/option settlement, exactly as before; priceIndexId
 * populated (contractTicker/exchange/tickSize null) means a daily
 * Platts/Argus/internal/other physical or swap index fixing. There is no
 * separate "kind" column — V170 dropped it as a redundant discriminator
 * fully implied by which identity path is populated; chk_sp_identity in the
 * DB enforces exactly one path, matching this class's existing pattern of
 * trusting DB CHECK constraints for cross-field rules.
 *
 * V174 — openPrice/highPrice/lowPrice/avgPrice added: supplementary daily
 * range/average context on the same row, not a new "kind" axis. settlePrice
 * stays the one authoritative value every downstream reader (pricing
 * formulas, MTM, invoicing) already resolves against; these four are
 * optional context alongside it. chk_sp_ohlc_range enforces high >= low
 * when both are populated.
 * V175 — promptPrice added: some vendors publish a genuinely distinct
 * "prompt" price (e.g. UK NBP within-day/day-ahead) separate from the
 * settle/open/high/low/avg values above — its own nullable column, not a
 * synonym for any of them.
 * V177 — periodId added (nullable FK to dbo.period): which specific
 * delivery period/tenor this price row belongs to, closing the gap where a
 * forward curve (index + per-period prices) couldn't be assembled from
 * stored settlement prices without inferring the period from contractTicker
 * text. Independent of chk_sp_identity's two-path rule — supplementary
 * tenor context on whichever identity path is populated, not a third path.
 * V178 — bidPrice/askPrice/midPrice added: OTC/broker-quote support
 * alongside settle/open/high/low/avg/prompt. chk_sp_bid_ask_range enforces
 * ask >= bid when both are populated.
 */
@Entity
@Table(name = "settlement_price")
@EntityListeners(AuditingEntityListener.class)
public class SettlementPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "settlement_price_id")
    private Integer settlementPriceId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Size(max = 40)
    @Column(name = "exchange", length = 40)
    private String exchange;

    @Size(max = 20)
    @Column(name = "contract_ticker", length = 20)
    private String contractTicker;

    @Column(name = "price_index_id")
    private Integer priceIndexId;

    @NotNull
    @Column(name = "settle_date", nullable = false)
    private LocalDate settleDate;

    @NotNull
    @Column(name = "settle_price", nullable = false, precision = 18, scale = 6)
    private BigDecimal settlePrice;

    @Column(name = "tick_size", precision = 12, scale = 6)
    private BigDecimal tickSize;

    @Column(name = "open_price", precision = 18, scale = 6)
    private BigDecimal openPrice;

    @Column(name = "high_price", precision = 18, scale = 6)
    private BigDecimal highPrice;

    @Column(name = "low_price", precision = 18, scale = 6)
    private BigDecimal lowPrice;

    @Column(name = "avg_price", precision = 18, scale = 6)
    private BigDecimal avgPrice;

    @Column(name = "prompt_price", precision = 18, scale = 6)
    private BigDecimal promptPrice;

    @Column(name = "bid_price", precision = 18, scale = 6)
    private BigDecimal bidPrice;

    @Column(name = "ask_price", precision = 18, scale = 6)
    private BigDecimal askPrice;

    @Column(name = "mid_price", precision = 18, scale = 6)
    private BigDecimal midPrice;

    @Column(name = "period_id")
    private Long periodId;

    @Transient
    @JsonProperty
    private String periodCode;

    @NotNull
    @Column(name = "tick_currency_id", nullable = false)
    private Integer tickCurrencyId;

    @NotNull
    @Column(name = "uom_id", nullable = false)
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @NotNull
    @Column(name = "is_confirmed", nullable = false)
    private Boolean isConfirmed = false;

    @NotBlank
    @Size(max = 40)
    @Column(name = "source", nullable = false, length = 40)
    private String source;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
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

    public Integer getSettlementPriceId() {
        return settlementPriceId;
    }

    public void setSettlementPriceId(Integer settlementPriceId) {
        this.settlementPriceId = settlementPriceId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getContractTicker() {
        return contractTicker;
    }

    public void setContractTicker(String contractTicker) {
        this.contractTicker = contractTicker;
    }

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public LocalDate getSettleDate() {
        return settleDate;
    }

    public void setSettleDate(LocalDate settleDate) {
        this.settleDate = settleDate;
    }

    public BigDecimal getSettlePrice() {
        return settlePrice;
    }

    public void setSettlePrice(BigDecimal settlePrice) {
        this.settlePrice = settlePrice;
    }

    public BigDecimal getTickSize() {
        return tickSize;
    }

    public void setTickSize(BigDecimal tickSize) {
        this.tickSize = tickSize;
    }

    public BigDecimal getOpenPrice() {
        return openPrice;
    }

    public void setOpenPrice(BigDecimal openPrice) {
        this.openPrice = openPrice;
    }

    public BigDecimal getHighPrice() {
        return highPrice;
    }

    public void setHighPrice(BigDecimal highPrice) {
        this.highPrice = highPrice;
    }

    public BigDecimal getLowPrice() {
        return lowPrice;
    }

    public void setLowPrice(BigDecimal lowPrice) {
        this.lowPrice = lowPrice;
    }

    public BigDecimal getAvgPrice() {
        return avgPrice;
    }

    public void setAvgPrice(BigDecimal avgPrice) {
        this.avgPrice = avgPrice;
    }

    public BigDecimal getPromptPrice() {
        return promptPrice;
    }

    public void setPromptPrice(BigDecimal promptPrice) {
        this.promptPrice = promptPrice;
    }

    public BigDecimal getBidPrice() {
        return bidPrice;
    }

    public void setBidPrice(BigDecimal bidPrice) {
        this.bidPrice = bidPrice;
    }

    public BigDecimal getAskPrice() {
        return askPrice;
    }

    public void setAskPrice(BigDecimal askPrice) {
        this.askPrice = askPrice;
    }

    public BigDecimal getMidPrice() {
        return midPrice;
    }

    public void setMidPrice(BigDecimal midPrice) {
        this.midPrice = midPrice;
    }

    public Long getPeriodId() {
        return periodId;
    }

    public void setPeriodId(Long periodId) {
        this.periodId = periodId;
    }

    public String getPeriodCode() {
        return periodCode;
    }

    public void setPeriodCode(String periodCode) {
        this.periodCode = periodCode;
    }

    public Integer getTickCurrencyId() {
        return tickCurrencyId;
    }

    public void setTickCurrencyId(Integer tickCurrencyId) {
        this.tickCurrencyId = tickCurrencyId;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
