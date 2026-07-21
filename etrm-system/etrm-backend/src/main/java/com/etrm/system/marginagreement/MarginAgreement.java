package com.etrm.system.marginagreement;

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
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.margin_agreement — agreement_type/valuation_frequency/gov_law FK
 * dedicated tables — frontend sends/receives their string type_code,
 * translated by MarginAgreementService (same pattern as
 * LetterOfCredit.lcType/status).
 *
 * V147 — added created_by/updated_by and upgraded created_at/updated_at to
 * real @CreatedDate/@LastModifiedDate JPA auditing.
 */
@Entity
@Table(name = "margin_agreement")
@EntityListeners(AuditingEntityListener.class)
public class MarginAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "margin_agreement_id")
    private Integer marginAgreementId;

    // V127 — optimistic locking, see LegalEntity.rowVersion for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 50)
    @Column(name = "agreement_code", nullable = false, length = 50)
    private String agreementCode;

    // FK -> dbo.margin_agreement_type(margin_agreement_type_id).
    @Column(name = "agreement_type")
    private Integer agreementTypeId;

    @Transient
    private String agreementType;

    @NotNull
    @Column(name = "counterparty_id", nullable = false)
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @NotNull
    @Column(name = "threshold_amount", nullable = false)
    private BigDecimal thresholdAmount;

    @NotNull
    @Column(name = "threshold_currency_id", nullable = false)
    private Integer thresholdCurrencyId;

    @NotNull
    @Column(name = "cp_threshold_amount", nullable = false)
    private BigDecimal cpThresholdAmount;

    @NotNull
    @Column(name = "cp_threshold_currency_id", nullable = false)
    private Integer cpThresholdCurrencyId;

    @NotNull
    @Column(name = "mta_amount", nullable = false)
    private BigDecimal mtaAmount;

    @NotNull
    @Column(name = "mta_currency_id", nullable = false)
    private Integer mtaCurrencyId;

    @Column(name = "independent_amount")
    private BigDecimal independentAmount;

    @Column(name = "independent_amount_currency_id")
    private Integer independentAmountCurrencyId;

    @Column(name = "rounding_amount")
    private BigDecimal roundingAmount;

    // FK -> dbo.valuation_frequency_type(valuation_frequency_type_id).
    @Column(name = "valuation_frequency")
    private Integer valuationFrequencyId;

    @Transient
    private String valuationFrequency;

    @Size(max = 500)
    @Column(name = "eligible_collateral", length = 500)
    private String eligibleCollateral;

    @Size(max = 100)
    @Column(name = "eligible_currencies", length = 100)
    private String eligibleCurrencies;

    // FK -> dbo.governing_law_type(governing_law_type_id).
    @Column(name = "gov_law")
    private Integer govLawId;

    @Transient
    private String govLaw;

    @NotNull
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
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

    public Integer getMarginAgreementId() {
        return marginAgreementId;
    }

    public void setMarginAgreementId(Integer marginAgreementId) {
        this.marginAgreementId = marginAgreementId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getAgreementCode() {
        return agreementCode;
    }

    public void setAgreementCode(String agreementCode) {
        this.agreementCode = agreementCode;
    }

    public Integer getAgreementTypeId() {
        return agreementTypeId;
    }

    public void setAgreementTypeId(Integer agreementTypeId) {
        this.agreementTypeId = agreementTypeId;
    }

    @JsonProperty("agreementType")
    public String getAgreementType() {
        return agreementType;
    }

    @JsonProperty("agreementType")
    public void setAgreementType(String agreementType) {
        this.agreementType = agreementType;
    }

    public Integer getCounterpartyId() {
        return counterpartyId;
    }

    public void setCounterpartyId(Integer counterpartyId) {
        this.counterpartyId = counterpartyId;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public BigDecimal getThresholdAmount() {
        return thresholdAmount;
    }

    public void setThresholdAmount(BigDecimal thresholdAmount) {
        this.thresholdAmount = thresholdAmount;
    }

    public Integer getThresholdCurrencyId() {
        return thresholdCurrencyId;
    }

    public void setThresholdCurrencyId(Integer thresholdCurrencyId) {
        this.thresholdCurrencyId = thresholdCurrencyId;
    }

    public BigDecimal getCpThresholdAmount() {
        return cpThresholdAmount;
    }

    public void setCpThresholdAmount(BigDecimal cpThresholdAmount) {
        this.cpThresholdAmount = cpThresholdAmount;
    }

    public Integer getCpThresholdCurrencyId() {
        return cpThresholdCurrencyId;
    }

    public void setCpThresholdCurrencyId(Integer cpThresholdCurrencyId) {
        this.cpThresholdCurrencyId = cpThresholdCurrencyId;
    }

    public BigDecimal getMtaAmount() {
        return mtaAmount;
    }

    public void setMtaAmount(BigDecimal mtaAmount) {
        this.mtaAmount = mtaAmount;
    }

    public Integer getMtaCurrencyId() {
        return mtaCurrencyId;
    }

    public void setMtaCurrencyId(Integer mtaCurrencyId) {
        this.mtaCurrencyId = mtaCurrencyId;
    }

    public BigDecimal getIndependentAmount() {
        return independentAmount;
    }

    public void setIndependentAmount(BigDecimal independentAmount) {
        this.independentAmount = independentAmount;
    }

    public Integer getIndependentAmountCurrencyId() {
        return independentAmountCurrencyId;
    }

    public void setIndependentAmountCurrencyId(Integer independentAmountCurrencyId) {
        this.independentAmountCurrencyId = independentAmountCurrencyId;
    }

    public BigDecimal getRoundingAmount() {
        return roundingAmount;
    }

    public void setRoundingAmount(BigDecimal roundingAmount) {
        this.roundingAmount = roundingAmount;
    }

    public Integer getValuationFrequencyId() {
        return valuationFrequencyId;
    }

    public void setValuationFrequencyId(Integer valuationFrequencyId) {
        this.valuationFrequencyId = valuationFrequencyId;
    }

    @JsonProperty("valuationFrequency")
    public String getValuationFrequency() {
        return valuationFrequency;
    }

    @JsonProperty("valuationFrequency")
    public void setValuationFrequency(String valuationFrequency) {
        this.valuationFrequency = valuationFrequency;
    }

    public String getEligibleCollateral() {
        return eligibleCollateral;
    }

    public void setEligibleCollateral(String eligibleCollateral) {
        this.eligibleCollateral = eligibleCollateral;
    }

    public String getEligibleCurrencies() {
        return eligibleCurrencies;
    }

    public void setEligibleCurrencies(String eligibleCurrencies) {
        this.eligibleCurrencies = eligibleCurrencies;
    }

    public Integer getGovLawId() {
        return govLawId;
    }

    public void setGovLawId(Integer govLawId) {
        this.govLawId = govLawId;
    }

    @JsonProperty("govLaw")
    public String getGovLaw() {
        return govLaw;
    }

    @JsonProperty("govLaw")
    public void setGovLaw(String govLaw) {
        this.govLaw = govLaw;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
