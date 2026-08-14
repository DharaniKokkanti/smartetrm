package com.etrm.system.tickermapping;

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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * dbo.ticker_mapping (V176) — the master lookup a price-load process resolves
 * an incoming vendor ticker string against, to find the price_index + period
 * (tenor) + price_source it represents, instead of parsing exchange
 * month-code conventions out of the string itself.
 * period_id is nullable — a continuous/rolling front-month ticker (e.g.
 * Bloomberg CL1) isn't tied to one fixed delivery period.
 * One column per settlement_price price field (settle/open/high/low/avg/
 * prompt/bid/ask/mid) rather than a single vendor_ticker — the same vendor
 * feed often publishes a different ticker string per field (Dharani's
 * explicit design decision, 2026-07-28). All nullable; chk_ticker_mapping_
 * at_least_one_field requires at least one populated.
 * priceIndexCode/periodCode/sourceCode hydrated for display — see
 * TickerMappingService.hydrate().
 */
@Entity
@Table(name = "ref_ticker_mapping")
public class TickerMapping extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticker_mapping_id")
    private Integer tickerMappingId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "price_index_id", nullable = false)
    private Integer priceIndexId;

    @Transient
    @JsonProperty
    private String priceIndexCode;

    @Transient
    @JsonProperty
    private String priceIndexName;

    @Column(name = "period_id")
    private Long periodId;

    @Transient
    @JsonProperty
    private String periodCode;

    @NotNull
    @Column(name = "price_source_id", nullable = false)
    private Integer priceSourceId;

    @Transient
    @JsonProperty
    private String sourceCode;

    @Transient
    @JsonProperty
    private String sourceName;

    @Size(max = 50)
    @Column(name = "settle_ticker", length = 50)
    private String settleTicker;

    @Size(max = 50)
    @Column(name = "open_ticker", length = 50)
    private String openTicker;

    @Size(max = 50)
    @Column(name = "high_ticker", length = 50)
    private String highTicker;

    @Size(max = 50)
    @Column(name = "low_ticker", length = 50)
    private String lowTicker;

    @Size(max = 50)
    @Column(name = "avg_ticker", length = 50)
    private String avgTicker;

    @Size(max = 50)
    @Column(name = "prompt_ticker", length = 50)
    private String promptTicker;

    @Size(max = 50)
    @Column(name = "bid_ticker", length = 50)
    private String bidTicker;

    @Size(max = 50)
    @Column(name = "ask_ticker", length = 50)
    private String askTicker;

    @Size(max = 50)
    @Column(name = "mid_ticker", length = 50)
    private String midTicker;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getTickerMappingId() {
        return tickerMappingId;
    }

    public void setTickerMappingId(Integer tickerMappingId) {
        this.tickerMappingId = tickerMappingId;
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

    public String getPriceIndexCode() {
        return priceIndexCode;
    }

    public void setPriceIndexCode(String priceIndexCode) {
        this.priceIndexCode = priceIndexCode;
    }

    public String getPriceIndexName() {
        return priceIndexName;
    }

    public void setPriceIndexName(String priceIndexName) {
        this.priceIndexName = priceIndexName;
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

    public Integer getPriceSourceId() {
        return priceSourceId;
    }

    public void setPriceSourceId(Integer priceSourceId) {
        this.priceSourceId = priceSourceId;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getSettleTicker() {
        return settleTicker;
    }

    public void setSettleTicker(String settleTicker) {
        this.settleTicker = settleTicker;
    }

    public String getOpenTicker() {
        return openTicker;
    }

    public void setOpenTicker(String openTicker) {
        this.openTicker = openTicker;
    }

    public String getHighTicker() {
        return highTicker;
    }

    public void setHighTicker(String highTicker) {
        this.highTicker = highTicker;
    }

    public String getLowTicker() {
        return lowTicker;
    }

    public void setLowTicker(String lowTicker) {
        this.lowTicker = lowTicker;
    }

    public String getAvgTicker() {
        return avgTicker;
    }

    public void setAvgTicker(String avgTicker) {
        this.avgTicker = avgTicker;
    }

    public String getPromptTicker() {
        return promptTicker;
    }

    public void setPromptTicker(String promptTicker) {
        this.promptTicker = promptTicker;
    }

    public String getBidTicker() {
        return bidTicker;
    }

    public void setBidTicker(String bidTicker) {
        this.bidTicker = bidTicker;
    }

    public String getAskTicker() {
        return askTicker;
    }

    public void setAskTicker(String askTicker) {
        this.askTicker = askTicker;
    }

    public String getMidTicker() {
        return midTicker;
    }

    public void setMidTicker(String midTicker) {
        this.midTicker = midTicker;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
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
