package com.etrm.system.charterparty;

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
@Table(name = "charter_party")
public class CharterParty extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "charter_party_id")
    private Integer charterPartyId;

    @NotBlank
    @Size(max = 50)
    @Column(name = "cp_reference", nullable = false, length = 50)
    private String cpReference;

    @NotNull
    @Column(name = "charter_party_type_id", nullable = false)
    private Integer charterPartyTypeId;

    @Transient
    @JsonProperty
    private String charterPartyTypeCode;

    @NotNull
    @Column(name = "vessel_id", nullable = false)
    private Integer vesselId;

    @Transient
    @JsonProperty
    private String vesselName;

    @NotNull
    @Column(name = "counterparty_id", nullable = false)
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @NotBlank
    @Column(name = "direction", nullable = false, length = 15)
    private String direction;

    @Column(name = "hire_rate", precision = 14, scale = 2)
    private BigDecimal hireRate;

    @Column(name = "hire_currency_id")
    private Integer hireCurrencyId;

    @Transient
    @JsonProperty
    private String hireCurrencyCode;

    @Column(name = "hire_payment_frequency", length = 20)
    private String hirePaymentFrequency;

    @Column(name = "freight_rate", precision = 14, scale = 4)
    private BigDecimal freightRate;

    @Column(name = "freight_rate_basis", length = 20)
    private String freightRateBasis;

    @Column(name = "laytime_term_id")
    private Integer laytimeTermId;

    @Transient
    @JsonProperty
    private String laytimeTermCode;

    @Column(name = "demurrage_rate_per_day", precision = 14, scale = 2)
    private BigDecimal demurrageRatePerDay;

    @Column(name = "dispatch_rate_per_day", precision = 14, scale = 2)
    private BigDecimal dispatchRatePerDay;

    @Column(name = "delivery_location_id")
    private Integer deliveryLocationId;

    @Transient
    @JsonProperty
    private String deliveryLocationName;

    @Column(name = "redelivery_location_id")
    private Integer redeliveryLocationId;

    @Transient
    @JsonProperty
    private String redeliveryLocationName;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "redelivery_date_estimate")
    private LocalDate redeliveryDateEstimate;

    @Column(name = "bunker_clause_basis", length = 20)
    private String bunkerClauseBasis;

    @Column(name = "bunker_clause_tolerance_pct", precision = 5, scale = 2)
    private BigDecimal bunkerClauseTolerancePct;

    @Column(name = "option_period_months")
    private Short optionPeriodMonths;

    @NotBlank
    @Column(name = "status", nullable = false, length = 15)
    private String status = "ON_SUBS";

    @Column(name = "charter_party_template_id")
    private Integer charterPartyTemplateId;

    @Transient
    @JsonProperty
    private String charterPartyTemplateCode;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getCharterPartyId() {
        return charterPartyId;
    }

    public void setCharterPartyId(Integer charterPartyId) {
        this.charterPartyId = charterPartyId;
    }

    public String getCpReference() {
        return cpReference;
    }

    public void setCpReference(String cpReference) {
        this.cpReference = cpReference;
    }

    public Integer getCharterPartyTypeId() {
        return charterPartyTypeId;
    }

    public void setCharterPartyTypeId(Integer charterPartyTypeId) {
        this.charterPartyTypeId = charterPartyTypeId;
    }

    public String getCharterPartyTypeCode() {
        return charterPartyTypeCode;
    }

    public void setCharterPartyTypeCode(String charterPartyTypeCode) {
        this.charterPartyTypeCode = charterPartyTypeCode;
    }

    public Integer getVesselId() {
        return vesselId;
    }

    public void setVesselId(Integer vesselId) {
        this.vesselId = vesselId;
    }

    public String getVesselName() {
        return vesselName;
    }

    public void setVesselName(String vesselName) {
        this.vesselName = vesselName;
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

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public BigDecimal getHireRate() {
        return hireRate;
    }

    public void setHireRate(BigDecimal hireRate) {
        this.hireRate = hireRate;
    }

    public Integer getHireCurrencyId() {
        return hireCurrencyId;
    }

    public void setHireCurrencyId(Integer hireCurrencyId) {
        this.hireCurrencyId = hireCurrencyId;
    }

    public String getHireCurrencyCode() {
        return hireCurrencyCode;
    }

    public void setHireCurrencyCode(String hireCurrencyCode) {
        this.hireCurrencyCode = hireCurrencyCode;
    }

    public String getHirePaymentFrequency() {
        return hirePaymentFrequency;
    }

    public void setHirePaymentFrequency(String hirePaymentFrequency) {
        this.hirePaymentFrequency = hirePaymentFrequency;
    }

    public BigDecimal getFreightRate() {
        return freightRate;
    }

    public void setFreightRate(BigDecimal freightRate) {
        this.freightRate = freightRate;
    }

    public String getFreightRateBasis() {
        return freightRateBasis;
    }

    public void setFreightRateBasis(String freightRateBasis) {
        this.freightRateBasis = freightRateBasis;
    }

    public Integer getLaytimeTermId() {
        return laytimeTermId;
    }

    public void setLaytimeTermId(Integer laytimeTermId) {
        this.laytimeTermId = laytimeTermId;
    }

    public String getLaytimeTermCode() {
        return laytimeTermCode;
    }

    public void setLaytimeTermCode(String laytimeTermCode) {
        this.laytimeTermCode = laytimeTermCode;
    }

    public BigDecimal getDemurrageRatePerDay() {
        return demurrageRatePerDay;
    }

    public void setDemurrageRatePerDay(BigDecimal demurrageRatePerDay) {
        this.demurrageRatePerDay = demurrageRatePerDay;
    }

    public BigDecimal getDispatchRatePerDay() {
        return dispatchRatePerDay;
    }

    public void setDispatchRatePerDay(BigDecimal dispatchRatePerDay) {
        this.dispatchRatePerDay = dispatchRatePerDay;
    }

    public Integer getDeliveryLocationId() {
        return deliveryLocationId;
    }

    public void setDeliveryLocationId(Integer deliveryLocationId) {
        this.deliveryLocationId = deliveryLocationId;
    }

    public String getDeliveryLocationName() {
        return deliveryLocationName;
    }

    public void setDeliveryLocationName(String deliveryLocationName) {
        this.deliveryLocationName = deliveryLocationName;
    }

    public Integer getRedeliveryLocationId() {
        return redeliveryLocationId;
    }

    public void setRedeliveryLocationId(Integer redeliveryLocationId) {
        this.redeliveryLocationId = redeliveryLocationId;
    }

    public String getRedeliveryLocationName() {
        return redeliveryLocationName;
    }

    public void setRedeliveryLocationName(String redeliveryLocationName) {
        this.redeliveryLocationName = redeliveryLocationName;
    }

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(LocalDate deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public LocalDate getRedeliveryDateEstimate() {
        return redeliveryDateEstimate;
    }

    public void setRedeliveryDateEstimate(LocalDate redeliveryDateEstimate) {
        this.redeliveryDateEstimate = redeliveryDateEstimate;
    }

    public String getBunkerClauseBasis() {
        return bunkerClauseBasis;
    }

    public void setBunkerClauseBasis(String bunkerClauseBasis) {
        this.bunkerClauseBasis = bunkerClauseBasis;
    }

    public BigDecimal getBunkerClauseTolerancePct() {
        return bunkerClauseTolerancePct;
    }

    public void setBunkerClauseTolerancePct(BigDecimal bunkerClauseTolerancePct) {
        this.bunkerClauseTolerancePct = bunkerClauseTolerancePct;
    }

    public Short getOptionPeriodMonths() {
        return optionPeriodMonths;
    }

    public void setOptionPeriodMonths(Short optionPeriodMonths) {
        this.optionPeriodMonths = optionPeriodMonths;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getCharterPartyTemplateId() {
        return charterPartyTemplateId;
    }

    public void setCharterPartyTemplateId(Integer charterPartyTemplateId) {
        this.charterPartyTemplateId = charterPartyTemplateId;
    }

    public String getCharterPartyTemplateCode() {
        return charterPartyTemplateCode;
    }

    public void setCharterPartyTemplateCode(String charterPartyTemplateCode) {
        this.charterPartyTemplateCode = charterPartyTemplateCode;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
