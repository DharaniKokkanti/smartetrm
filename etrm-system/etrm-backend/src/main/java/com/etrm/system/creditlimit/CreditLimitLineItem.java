package com.etrm.system.creditlimit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Instrument-class sub-limit carve-out under a credit_limit header row. */
@Entity
@Table(name = "credit_limit_line_item")
public class CreditLimitLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "line_item_id")
    private Integer lineItemId;

    // V128 — optimistic locking (see LegalEntity.rowVersion doc comment).
    // CreditLimitService.saveLineItems deletes and recreates every line item
    // wholesale on each credit_limit save (never an individual row update),
    // so there's no real stale-write scenario to protect here; added purely
    // for schema consistency with the rest of this batch.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "credit_limit_id", nullable = false)
    private Integer creditLimitId;

    @NotBlank
    @Column(name = "instrument_class", nullable = false, length = 20)
    private String instrumentClass;

    @NotNull
    @Column(name = "sub_limit_amount", nullable = false)
    private BigDecimal subLimitAmount;

    @NotNull
    @Column(name = "used_amount", nullable = false)
    private BigDecimal usedAmount = BigDecimal.ZERO;

    @Column(name = "tenor_cap_months")
    private Integer tenorCapMonths;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getLineItemId() {
        return lineItemId;
    }

    public void setLineItemId(Integer lineItemId) {
        this.lineItemId = lineItemId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getCreditLimitId() {
        return creditLimitId;
    }

    public void setCreditLimitId(Integer creditLimitId) {
        this.creditLimitId = creditLimitId;
    }

    public String getInstrumentClass() {
        return instrumentClass;
    }

    public void setInstrumentClass(String instrumentClass) {
        this.instrumentClass = instrumentClass;
    }

    public BigDecimal getSubLimitAmount() {
        return subLimitAmount;
    }

    public void setSubLimitAmount(BigDecimal subLimitAmount) {
        this.subLimitAmount = subLimitAmount;
    }

    public BigDecimal getUsedAmount() {
        return usedAmount;
    }

    public void setUsedAmount(BigDecimal usedAmount) {
        this.usedAmount = usedAmount;
    }

    public Integer getTenorCapMonths() {
        return tenorCapMonths;
    }

    public void setTenorCapMonths(Integer tenorCapMonths) {
        this.tenorCapMonths = tenorCapMonths;
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
