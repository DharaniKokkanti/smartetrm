package com.etrm.system.commercialterms;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Entity
@Table(name = "cp_commercial_terms")
public class CpCommercialTerms extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cp_terms_id")
    private Integer cpTermsId;

    @NotNull
    @Column(name = "counterparty_id", nullable = false)
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityName;

    @NotNull
    @Column(name = "payment_term_id", nullable = false)
    private Integer paymentTermId;

    @Transient
    @JsonProperty
    private String paymentTermName;

    @NotNull
    @Column(name = "credit_term_id", nullable = false)
    private Integer creditTermId;

    @Transient
    @JsonProperty
    private String creditTermName;

    @Column(name = "default_currency_id")
    private Integer defaultCurrencyId;

    @Column(name = "default_incoterm_id")
    private Integer defaultIncotermId;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @NotNull
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getCpTermsId() {
        return cpTermsId;
    }

    public void setCpTermsId(Integer cpTermsId) {
        this.cpTermsId = cpTermsId;
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

    public Integer getPaymentTermId() {
        return paymentTermId;
    }

    public void setPaymentTermId(Integer paymentTermId) {
        this.paymentTermId = paymentTermId;
    }

    public String getPaymentTermName() {
        return paymentTermName;
    }

    public void setPaymentTermName(String paymentTermName) {
        this.paymentTermName = paymentTermName;
    }

    public Integer getCreditTermId() {
        return creditTermId;
    }

    public void setCreditTermId(Integer creditTermId) {
        this.creditTermId = creditTermId;
    }

    public String getCreditTermName() {
        return creditTermName;
    }

    public void setCreditTermName(String creditTermName) {
        this.creditTermName = creditTermName;
    }

    public Integer getDefaultCurrencyId() {
        return defaultCurrencyId;
    }

    public void setDefaultCurrencyId(Integer defaultCurrencyId) {
        this.defaultCurrencyId = defaultCurrencyId;
    }

    public Integer getDefaultIncotermId() {
        return defaultIncotermId;
    }

    public void setDefaultIncotermId(Integer defaultIncotermId) {
        this.defaultIncotermId = defaultIncotermId;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
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
}
