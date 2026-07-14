package com.etrm.system.insurancepolicy;

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
@Table(name = "insurance_policy")
public class InsurancePolicy extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "policy_id")
    private Integer policyId;

    @NotNull
    @Column(name = "provider_id", nullable = false)
    private Integer providerId;

    @Transient
    @JsonProperty
    private String providerName;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "policy_number", nullable = false, length = 100)
    private String policyNumber;

    @NotBlank
    @Column(name = "policy_type", nullable = false, length = 30)
    private String policyType;

    @Size(max = 30)
    @Column(name = "insured_entity_type", length = 30)
    private String insuredEntityType;

    @Column(name = "insured_entity_id")
    private Integer insuredEntityId;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "sum_insured", nullable = false)
    private BigDecimal sumInsured;

    @NotNull
    @Column(name = "deductible", nullable = false)
    private BigDecimal deductible;

    @Column(name = "premium_amount")
    private BigDecimal premiumAmount;

    @Column(name = "premium_currency_id")
    private Integer premiumCurrencyId;

    @Size(max = 20)
    @Column(name = "premium_frequency", length = 20)
    private String premiumFrequency;

    @NotNull
    @Column(name = "inception_date", nullable = false)
    private LocalDate inceptionDate;

    @NotNull
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @NotBlank
    @Column(name = "policy_status", nullable = false, length = 20)
    private String policyStatus;

    @Column(name = "document_store_id")
    private Integer documentStoreId;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Integer policyId) {
        this.policyId = policyId;
    }

    public Integer getProviderId() {
        return providerId;
    }

    public void setProviderId(Integer providerId) {
        this.providerId = providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
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

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public String getPolicyType() {
        return policyType;
    }

    public void setPolicyType(String policyType) {
        this.policyType = policyType;
    }

    public String getInsuredEntityType() {
        return insuredEntityType;
    }

    public void setInsuredEntityType(String insuredEntityType) {
        this.insuredEntityType = insuredEntityType;
    }

    public Integer getInsuredEntityId() {
        return insuredEntityId;
    }

    public void setInsuredEntityId(Integer insuredEntityId) {
        this.insuredEntityId = insuredEntityId;
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

    public BigDecimal getSumInsured() {
        return sumInsured;
    }

    public void setSumInsured(BigDecimal sumInsured) {
        this.sumInsured = sumInsured;
    }

    public BigDecimal getDeductible() {
        return deductible;
    }

    public void setDeductible(BigDecimal deductible) {
        this.deductible = deductible;
    }

    public BigDecimal getPremiumAmount() {
        return premiumAmount;
    }

    public void setPremiumAmount(BigDecimal premiumAmount) {
        this.premiumAmount = premiumAmount;
    }

    public Integer getPremiumCurrencyId() {
        return premiumCurrencyId;
    }

    public void setPremiumCurrencyId(Integer premiumCurrencyId) {
        this.premiumCurrencyId = premiumCurrencyId;
    }

    public String getPremiumFrequency() {
        return premiumFrequency;
    }

    public void setPremiumFrequency(String premiumFrequency) {
        this.premiumFrequency = premiumFrequency;
    }

    public LocalDate getInceptionDate() {
        return inceptionDate;
    }

    public void setInceptionDate(LocalDate inceptionDate) {
        this.inceptionDate = inceptionDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getPolicyStatus() {
        return policyStatus;
    }

    public void setPolicyStatus(String policyStatus) {
        this.policyStatus = policyStatus;
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
