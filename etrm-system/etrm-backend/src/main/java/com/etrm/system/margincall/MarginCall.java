package com.etrm.system.margincall;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.etrm.system.common.SourceSystemDefaults;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.margin_call (V5, governance columns added V211) — a per-margin_account
 * (i.e. per-market) pay-or-receive margin demand ledger entry. Distinct from
 * dbo.margin_valuation (V206), the account-wide EOD calculation that
 * produces the numbers a call gets issued from — margin_call optionally
 * links back to the valuation run that triggered it.
 */
@Entity
@Table(name = "margin_call")
@EntityListeners(AuditingEntityListener.class)
public class MarginCall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "call_id")
    private Integer callId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "margin_account_id", nullable = false)
    private Integer marginAccountId;

    @Transient
    @JsonProperty
    private String marginAccountCode;

    @NotNull
    @Column(name = "call_date", nullable = false)
    private LocalDate callDate;

    @NotNull
    @Column(name = "call_type", nullable = false, length = 20)
    private String callType;

    @NotNull
    @Column(name = "call_direction", nullable = false, length = 10)
    private String callDirection;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "call_amount", nullable = false)
    private BigDecimal callAmount;

    @NotNull
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @NotNull
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "paid_amount")
    private BigDecimal paidAmount;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "margin_valuation_id")
    private Long marginValuationId;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
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

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getCallId() { return callId; }
    public void setCallId(Integer callId) { this.callId = callId; }

    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }

    public Integer getMarginAccountId() { return marginAccountId; }
    public void setMarginAccountId(Integer marginAccountId) { this.marginAccountId = marginAccountId; }

    public String getMarginAccountCode() { return marginAccountCode; }
    public void setMarginAccountCode(String marginAccountCode) { this.marginAccountCode = marginAccountCode; }

    public LocalDate getCallDate() { return callDate; }
    public void setCallDate(LocalDate callDate) { this.callDate = callDate; }

    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }

    public String getCallDirection() { return callDirection; }
    public void setCallDirection(String callDirection) { this.callDirection = callDirection; }

    public Integer getCurrencyId() { return currencyId; }
    public void setCurrencyId(Integer currencyId) { this.currencyId = currencyId; }

    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }

    public BigDecimal getCallAmount() { return callAmount; }
    public void setCallAmount(BigDecimal callAmount) { this.callAmount = callAmount; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }

    public Long getMarginValuationId() { return marginValuationId; }
    public void setMarginValuationId(Long marginValuationId) { this.marginValuationId = marginValuationId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Short getCreatedSrcId() { return createdSrcId; }
    public void setCreatedSrcId(Short createdSrcId) { this.createdSrcId = createdSrcId; }

    public Short getUpdatedSrcId() { return updatedSrcId; }
    public void setUpdatedSrcId(Short updatedSrcId) { this.updatedSrcId = updatedSrcId; }
}
