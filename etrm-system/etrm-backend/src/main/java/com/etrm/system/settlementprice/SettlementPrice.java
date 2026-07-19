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
import org.springframework.data.annotation.CreatedDate;
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

    @NotBlank
    @Size(max = 40)
    @Column(name = "exchange", nullable = false, length = 40)
    private String exchange;

    @NotBlank
    @Size(max = 20)
    @Column(name = "contract_ticker", nullable = false, length = 20)
    private String contractTicker;

    @NotNull
    @Column(name = "settle_date", nullable = false)
    private LocalDate settleDate;

    @NotNull
    @Column(name = "settle_price", nullable = false, precision = 18, scale = 6)
    private BigDecimal settlePrice;

    @NotNull
    @Column(name = "tick_size", nullable = false, precision = 12, scale = 6)
    private BigDecimal tickSize;

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

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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
}
