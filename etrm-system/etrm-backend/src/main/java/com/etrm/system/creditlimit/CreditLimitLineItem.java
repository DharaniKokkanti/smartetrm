package com.etrm.system.creditlimit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
import java.time.LocalDateTime;

/**
 * Instrument-class sub-limit carve-out under a credit_limit header row.
 *
 * V145 — added created_by/updated_by (previously only had created_at/
 * updated_at); upgraded all 4 audit fields to real JPA-auditing annotations.
 * CreditLimitService.saveLineItems deletes and recreates every line item
 * wholesale on each credit_limit save (never an individual row update), so
 * every save is a fresh INSERT and @CreatedDate/@CreatedBy/
 * @LastModifiedDate/@LastModifiedBy all populate correctly on that insert.
 */
@Entity
@Table(name = "credit_limit_line_item")
@EntityListeners(AuditingEntityListener.class)
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
