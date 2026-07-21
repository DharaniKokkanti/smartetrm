package com.etrm.system.glaccount;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

import java.time.LocalDateTime;

/**
 * dbo.gl_account is a dedicated (non-Tier2) entity. normal_balance is a plain
 * CHECK-backed string ('DEBIT'/'CREDIT'), not an FK, matching the frontend's
 * NormalBalance union type. account_type IS an FK to lookup_value(category
 * 'GL_ACCOUNT_TYPE') and is resolved to its code string via
 * LookupResolutionService, but commodity_type is passed through unresolved
 * as a raw lookup_id (category 'commodity_type') per the frontend's own
 * `commodityType: number | null` type. parent_account_id is self-referencing
 * (gl_account -> gl_account); only the parent's own account_code is resolved
 * for display, no recursion.
 *
 * V142 — cost_center (free text) replaced with cost_center_id, an FK into the
 * new dbo.cost_center table (which itself FKs to dbo.profit_center); the
 * profit center is deliberately NOT duplicated here — reached by joining
 * through cost_center, per the "don't duplicate a derivable segment"
 * chart-of-accounts convention. Also added default_tax_code_id (FK to the new
 * dbo.tax_code) and created_by/updated_by (this dedicated entity had fallen
 * outside V137's registry-only governance-column audit).
 */
@Entity
@Table(name = "gl_account")
@EntityListeners(AuditingEntityListener.class)
public class GlAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Integer accountId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 60)
    @Column(name = "account_code", nullable = false, length = 60)
    private String accountCode;

    @NotBlank
    @Size(max = 400)
    @Column(name = "account_name", nullable = false, length = 400)
    private String accountName;

    // No @NotNull — client only sends the denormalized accountTypeCode
    // string (@JsonIgnore on this field's getter/setter below); this raw FK
    // id is populated by resolveForeignKeys() AFTER Bean Validation runs, so
    // @NotNull here would reject every real request.
    @Column(name = "account_type", nullable = false)
    private Integer accountType;

    @Transient
    @JsonProperty("accountType")
    private String accountTypeCode;

    @Column(name = "commodity_type")
    private Integer commodityType;

    @Column(name = "cost_center_id")
    private Integer costCenterId;

    @Transient
    @JsonProperty
    private String costCenterCode;

    @Column(name = "default_tax_code_id")
    private Integer defaultTaxCodeId;

    @Transient
    @JsonProperty
    private String defaultTaxCode;

    @Column(name = "description", columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "legal_entity_id")
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityCode;

    @Column(name = "book_id")
    private Integer bookId;

    @Transient
    @JsonProperty
    private String bookCode;

    @Column(name = "parent_account_id")
    private Integer parentAccountId;

    @Transient
    @JsonProperty
    private String parentAccountCode;

    @NotBlank
    @Size(max = 20)
    @Column(name = "normal_balance", nullable = false, length = 20)
    private String normalBalance;

    @Column(name = "currency_id")
    private Integer currencyId;

    @Size(max = 100)
    @Column(name = "external_gl_code", length = 100)
    private String externalGlCode;

    @NotNull
    @Column(name = "is_control_account", nullable = false)
    private Boolean isControlAccount = false;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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

    public Integer getAccountId() {
        return accountId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
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

    // @JsonIgnore — getAccountTypeCode() below is aliased to the same JSON
    // key "accountType" (the denormalized display code); without this,
    // Jackson sees two getters mapping to the same property and throws
    // InvalidDefinitionException on every response, a 500 for every caller.
    @JsonIgnore
    public Integer getAccountType() {
        return accountType;
    }

    @JsonIgnore
    public void setAccountType(Integer accountType) {
        this.accountType = accountType;
    }

    public String getAccountTypeCode() {
        return accountTypeCode;
    }

    public void setAccountTypeCode(String accountTypeCode) {
        this.accountTypeCode = accountTypeCode;
    }

    public Integer getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(Integer commodityType) {
        this.commodityType = commodityType;
    }

    public Integer getCostCenterId() {
        return costCenterId;
    }

    public void setCostCenterId(Integer costCenterId) {
        this.costCenterId = costCenterId;
    }

    public String getCostCenterCode() {
        return costCenterCode;
    }

    public void setCostCenterCode(String costCenterCode) {
        this.costCenterCode = costCenterCode;
    }

    public Integer getDefaultTaxCodeId() {
        return defaultTaxCodeId;
    }

    public void setDefaultTaxCodeId(Integer defaultTaxCodeId) {
        this.defaultTaxCodeId = defaultTaxCodeId;
    }

    public String getDefaultTaxCode() {
        return defaultTaxCode;
    }

    public void setDefaultTaxCode(String defaultTaxCode) {
        this.defaultTaxCode = defaultTaxCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getLegalEntityCode() {
        return legalEntityCode;
    }

    public void setLegalEntityCode(String legalEntityCode) {
        this.legalEntityCode = legalEntityCode;
    }

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public String getBookCode() {
        return bookCode;
    }

    public void setBookCode(String bookCode) {
        this.bookCode = bookCode;
    }

    public Integer getParentAccountId() {
        return parentAccountId;
    }

    public void setParentAccountId(Integer parentAccountId) {
        this.parentAccountId = parentAccountId;
    }

    public String getParentAccountCode() {
        return parentAccountCode;
    }

    public void setParentAccountCode(String parentAccountCode) {
        this.parentAccountCode = parentAccountCode;
    }

    public String getNormalBalance() {
        return normalBalance;
    }

    public void setNormalBalance(String normalBalance) {
        this.normalBalance = normalBalance;
    }

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public String getExternalGlCode() {
        return externalGlCode;
    }

    public void setExternalGlCode(String externalGlCode) {
        this.externalGlCode = externalGlCode;
    }

    public Boolean getIsControlAccount() {
        return isControlAccount;
    }

    public void setIsControlAccount(Boolean isControlAccount) {
        this.isControlAccount = isControlAccount;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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
