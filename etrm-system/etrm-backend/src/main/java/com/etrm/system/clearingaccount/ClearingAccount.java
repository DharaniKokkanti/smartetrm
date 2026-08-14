package com.etrm.system.clearingaccount;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.etrm.system.common.SourceSystemDefaults;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * dbo.clearing_account (V202) — the FCM/clearing-broker-level account a
 * legal entity holds margin balances under, potentially spanning multiple
 * markets/exchanges under one relationship. dbo.margin_account (V203)
 * references this for its clearing_broker/legal_entity/currency instead of
 * carrying them itself.
 */
@Entity
@Table(name = "ref_clearing_account")
@EntityListeners(AuditingEntityListener.class)
public class ClearingAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clearing_account_id")
    private Integer clearingAccountId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 50)
    @Column(name = "account_code", nullable = false, length = 50)
    private String accountCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Column(name = "primary_bank_account_id")
    private Integer primaryBankAccountId;

    @Transient
    @JsonProperty
    private String primaryBankAccountLabel;

    @NotNull
    @Column(name = "clearing_broker_id", nullable = false)
    private Integer clearingBrokerId;

    @Transient
    @JsonProperty
    private String clearingBrokerName;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityName;

    @NotNull
    @Column(name = "base_currency_id", nullable = false)
    private Integer baseCurrencyId;

    @Transient
    @JsonProperty
    private String baseCurrencyCode;

    @NotBlank
    @Column(name = "margin_calc_method", nullable = false, length = 20)
    private String marginCalcMethod;

    @NotNull
    @Column(name = "target_cash_buffer", nullable = false)
    private BigDecimal targetCashBuffer;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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

    public Integer getClearingAccountId() {
        return clearingAccountId;
    }

    public void setClearingAccountId(Integer clearingAccountId) {
        this.clearingAccountId = clearingAccountId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getAccountCode() {
        return accountCode;
    }

    public void setAccountCode(String accountCode) {
        this.accountCode = accountCode;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public Integer getPrimaryBankAccountId() {
        return primaryBankAccountId;
    }

    public void setPrimaryBankAccountId(Integer primaryBankAccountId) {
        this.primaryBankAccountId = primaryBankAccountId;
    }

    public String getPrimaryBankAccountLabel() {
        return primaryBankAccountLabel;
    }

    public void setPrimaryBankAccountLabel(String primaryBankAccountLabel) {
        this.primaryBankAccountLabel = primaryBankAccountLabel;
    }

    public Integer getClearingBrokerId() {
        return clearingBrokerId;
    }

    public void setClearingBrokerId(Integer clearingBrokerId) {
        this.clearingBrokerId = clearingBrokerId;
    }

    public String getClearingBrokerName() {
        return clearingBrokerName;
    }

    public void setClearingBrokerName(String clearingBrokerName) {
        this.clearingBrokerName = clearingBrokerName;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getLegalEntityName() {
        return legalEntityName;
    }

    public void setLegalEntityName(String legalEntityName) {
        this.legalEntityName = legalEntityName;
    }

    public Integer getBaseCurrencyId() {
        return baseCurrencyId;
    }

    public void setBaseCurrencyId(Integer baseCurrencyId) {
        this.baseCurrencyId = baseCurrencyId;
    }

    public String getBaseCurrencyCode() {
        return baseCurrencyCode;
    }

    public void setBaseCurrencyCode(String baseCurrencyCode) {
        this.baseCurrencyCode = baseCurrencyCode;
    }

    public String getMarginCalcMethod() {
        return marginCalcMethod;
    }

    public void setMarginCalcMethod(String marginCalcMethod) {
        this.marginCalcMethod = marginCalcMethod;
    }

    public BigDecimal getTargetCashBuffer() {
        return targetCashBuffer;
    }

    public void setTargetCashBuffer(BigDecimal targetCashBuffer) {
        this.targetCashBuffer = targetCashBuffer;
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

    public void setUpdatedSrcId(Short updatedSrcId) {
        this.updatedSrcId = updatedSrcId;
    }
}
