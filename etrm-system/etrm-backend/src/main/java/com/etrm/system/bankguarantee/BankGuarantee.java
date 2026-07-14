package com.etrm.system.bankguarantee;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "bank_guarantee")
public class BankGuarantee extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bg_id")
    private Integer bgId;

    @NotBlank
    @Size(max = 100)
    @Column(name = "bg_number", nullable = false, length = 100)
    private String bgNumber;

    @NotBlank
    @Column(name = "bg_type", nullable = false, length = 20)
    private String bgType;

    // FK -> dbo.counterparty(counterparty_id) — issuing banks are modeled as counterparties.
    @NotNull
    @Column(name = "issuing_bank_id", nullable = false)
    private Integer issuingBankId;

    @Transient
    @JsonProperty
    private String issuingBankName;

    @NotNull
    @Column(name = "principal_entity_id", nullable = false)
    private Integer principalEntityId;

    @Transient
    @JsonProperty
    private String principalEntityName;

    @NotNull
    @Column(name = "beneficiary_cp_id", nullable = false)
    private Integer beneficiaryCpId;

    @Transient
    @JsonProperty
    private String beneficiaryCpName;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "guarantee_amount", nullable = false)
    private BigDecimal guaranteeAmount;

    @NotNull
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @NotNull
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    // SMALLINT -> Short.
    @NotNull
    @Column(name = "claim_period_days", nullable = false)
    private Short claimPeriodDays;

    @NotBlank
    @Column(name = "bg_status", nullable = false, length = 20)
    private String bgStatus;

    @NotNull
    @Column(name = "amount_called", nullable = false)
    private BigDecimal amountCalled = BigDecimal.ZERO;

    @Column(name = "document_store_id")
    private Integer documentStoreId;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getBgId() {
        return bgId;
    }

    public void setBgId(Integer bgId) {
        this.bgId = bgId;
    }

    public String getBgNumber() {
        return bgNumber;
    }

    public void setBgNumber(String bgNumber) {
        this.bgNumber = bgNumber;
    }

    public String getBgType() {
        return bgType;
    }

    public void setBgType(String bgType) {
        this.bgType = bgType;
    }

    public Integer getIssuingBankId() {
        return issuingBankId;
    }

    public void setIssuingBankId(Integer issuingBankId) {
        this.issuingBankId = issuingBankId;
    }

    public String getIssuingBankName() {
        return issuingBankName;
    }

    public void setIssuingBankName(String issuingBankName) {
        this.issuingBankName = issuingBankName;
    }

    public Integer getPrincipalEntityId() {
        return principalEntityId;
    }

    public void setPrincipalEntityId(Integer principalEntityId) {
        this.principalEntityId = principalEntityId;
    }

    public String getPrincipalEntityName() {
        return principalEntityName;
    }

    public void setPrincipalEntityName(String principalEntityName) {
        this.principalEntityName = principalEntityName;
    }

    public Integer getBeneficiaryCpId() {
        return beneficiaryCpId;
    }

    public void setBeneficiaryCpId(Integer beneficiaryCpId) {
        this.beneficiaryCpId = beneficiaryCpId;
    }

    public String getBeneficiaryCpName() {
        return beneficiaryCpName;
    }

    public void setBeneficiaryCpName(String beneficiaryCpName) {
        this.beneficiaryCpName = beneficiaryCpName;
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

    public BigDecimal getGuaranteeAmount() {
        return guaranteeAmount;
    }

    public void setGuaranteeAmount(BigDecimal guaranteeAmount) {
        this.guaranteeAmount = guaranteeAmount;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Short getClaimPeriodDays() {
        return claimPeriodDays;
    }

    public void setClaimPeriodDays(Short claimPeriodDays) {
        this.claimPeriodDays = claimPeriodDays;
    }

    public String getBgStatus() {
        return bgStatus;
    }

    public void setBgStatus(String bgStatus) {
        this.bgStatus = bgStatus;
    }

    public BigDecimal getAmountCalled() {
        return amountCalled;
    }

    public void setAmountCalled(BigDecimal amountCalled) {
        this.amountCalled = amountCalled;
    }

    public Integer getDocumentStoreId() {
        return documentStoreId;
    }

    public void setDocumentStoreId(Integer documentStoreId) {
        this.documentStoreId = documentStoreId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
