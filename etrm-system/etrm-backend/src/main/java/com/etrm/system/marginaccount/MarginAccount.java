package com.etrm.system.marginaccount;

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
import java.time.LocalDateTime;

/**
 * dbo.margin_account — created_by is NOT NULL on the live schema but was
 * previously left completely unmapped despite an earlier version of this
 * comment claiming otherwise — that made every POST here 100% fail with a
 * NOT NULL constraint violation (same bug shape documented on Period.java).
 * Fixed with @CreatedDate/@CreatedBy field-level JPA-auditing annotations.
 *
 * V147 — added updated_at/updated_by with matching @LastModifiedDate/
 * @LastModifiedBy annotations.
 */
@Entity
@Table(name = "margin_account")
@EntityListeners(AuditingEntityListener.class)
public class MarginAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "margin_account_id")
    private Integer marginAccountId;

    // V128 — optimistic locking (see LegalEntity.rowVersion doc comment).
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityName;

    @NotNull
    @Column(name = "market_id", nullable = false)
    private Integer marketId;

    @Transient
    @JsonProperty
    private String marketName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "account_ref", nullable = false, length = 100)
    private String accountRef;

    @NotBlank
    @Column(name = "account_type", nullable = false, length = 20)
    private String accountType;

    // FK -> dbo.counterparty(counterparty_id) — clearing brokers are modeled as counterparties.
    @Column(name = "clearing_broker_id")
    private Integer clearingBrokerId;

    @Transient
    @JsonProperty
    private String clearingBrokerName;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "initial_margin", nullable = false)
    private BigDecimal initialMargin;

    @NotNull
    @Column(name = "variation_margin", nullable = false)
    private BigDecimal variationMargin;

    @NotNull
    @Column(name = "excess_margin", nullable = false)
    private BigDecimal excessMargin;

    @Column(name = "margin_limit")
    private BigDecimal marginLimit;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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

    public Integer getMarginAccountId() {
        return marginAccountId;
    }

    public void setMarginAccountId(Integer marginAccountId) {
        this.marginAccountId = marginAccountId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public Integer getMarketId() {
        return marketId;
    }

    public void setMarketId(Integer marketId) {
        this.marketId = marketId;
    }

    public String getMarketName() {
        return marketName;
    }

    public void setMarketName(String marketName) {
        this.marketName = marketName;
    }

    public String getAccountRef() {
        return accountRef;
    }

    public void setAccountRef(String accountRef) {
        this.accountRef = accountRef;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
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

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public BigDecimal getInitialMargin() {
        return initialMargin;
    }

    public void setInitialMargin(BigDecimal initialMargin) {
        this.initialMargin = initialMargin;
    }

    public BigDecimal getVariationMargin() {
        return variationMargin;
    }

    public void setVariationMargin(BigDecimal variationMargin) {
        this.variationMargin = variationMargin;
    }

    public BigDecimal getExcessMargin() {
        return excessMargin;
    }

    public void setExcessMargin(BigDecimal excessMargin) {
        this.excessMargin = excessMargin;
    }

    public BigDecimal getMarginLimit() {
        return marginLimit;
    }

    public void setMarginLimit(BigDecimal marginLimit) {
        this.marginLimit = marginLimit;
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
}
