package com.etrm.system.creditlimit;

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
import java.util.List;

/**
 * dbo.credit_limit. limit_type/status FK dedicated tables
 * (dbo.credit_limit_type/dbo.credit_limit_status_type) — same string-code
 * translation pattern as LetterOfCredit/MarginAgreement. commodity_type/
 * limit_basis/country_risk_rating/last_review_outcome/internal_rating/
 * external_rating/breach_action are all plain VARCHAR (never converted to
 * FKs) — map directly as String, matching the frontend's plain string-union
 * types. credit_analyst_name is a real, separately-stored column (not
 * computed) — left unmapped and always re-derived from
 * credit_analyst_user_id in CreditLimitService.hydrate() instead, consistent
 * with every other denormalized display field in this codebase (avoids two
 * sources of truth silently drifting).
 *
 * V145 — added created_by/updated_by (this entity previously only had
 * created_at/updated_at); upgraded all 4 audit fields to @CreatedDate/
 * @CreatedBy/@LastModifiedDate/@LastModifiedBy, matching GlAccount's shape.
 */
@Entity
@Table(name = "credit_limit")
@EntityListeners(AuditingEntityListener.class)
public class CreditLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credit_limit_id")
    private Integer creditLimitId;

    // V127 — optimistic locking, see LegalEntity.rowVersion for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "counterparty_id", nullable = false)
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @Column(name = "cp_country_id")
    private Integer cpCountryId;

    @Size(max = 10)
    @Column(name = "country_risk_rating", length = 10)
    private String countryRiskRating;

    // FK -> dbo.credit_limit_type(credit_limit_type_id).
    @Column(name = "limit_type")
    private Integer limitTypeId;

    @Transient
    private String limitType;

    @NotBlank
    @Column(name = "limit_basis", nullable = false, length = 10)
    private String limitBasis;

    @Column(name = "parent_limit_id")
    private Integer parentLimitId;

    @NotBlank
    @Column(name = "commodity_type", nullable = false, length = 20)
    private String commodityType;

    @NotNull
    @Column(name = "limit_amount", nullable = false)
    private BigDecimal limitAmount;

    @NotNull
    @Column(name = "limit_currency_id", nullable = false)
    private Integer limitCurrencyId;

    @NotNull
    @Column(name = "used_amount", nullable = false)
    private BigDecimal usedAmount = BigDecimal.ZERO;

    // Computed: limitAmount + tempUpliftAmount + collateralOffset - usedAmount.
    @Transient
    @JsonProperty
    private BigDecimal availableAmount;

    // Computed: usedAmount / limitAmount * 100.
    @Transient
    @JsonProperty
    private BigDecimal utilisationPct;

    @NotNull
    @Column(name = "collateral_offset", nullable = false)
    private BigDecimal collateralOffset = BigDecimal.ZERO;

    @Size(max = 100)
    @Column(name = "collateral_ref", length = 100)
    private String collateralRef;

    @Column(name = "temp_uplift_amount")
    private BigDecimal tempUpliftAmount;

    @Column(name = "temp_uplift_expiry")
    private LocalDate tempUpliftExpiry;

    @Column(name = "tenor_cap_months")
    private Integer tenorCapMonths;

    @NotNull
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "credit_analyst_user_id")
    private Integer creditAnalystUserId;

    @Transient
    @JsonProperty
    private String creditAnalystName;

    @Size(max = 100)
    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "review_frequency_days")
    private Integer reviewFrequencyDays;

    @Column(name = "last_review_date")
    private LocalDate lastReviewDate;

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Size(max = 10)
    @Column(name = "last_review_outcome", length = 10)
    private String lastReviewOutcome;

    @Size(max = 10)
    @Column(name = "internal_rating", length = 10)
    private String internalRating;

    @Size(max = 10)
    @Column(name = "external_rating", length = 10)
    private String externalRating;

    @NotNull
    @Column(name = "warning_threshold_pct", nullable = false)
    private BigDecimal warningThresholdPct = new BigDecimal("80");

    @NotNull
    @Column(name = "critical_threshold_pct", nullable = false)
    private BigDecimal criticalThresholdPct = new BigDecimal("95");

    @NotBlank
    @Column(name = "breach_action", nullable = false, length = 20)
    private String breachAction;

    @NotNull
    @Column(name = "alert_internal", nullable = false)
    private Boolean alertInternal = true;

    @NotNull
    @Column(name = "alert_counterparty", nullable = false)
    private Boolean alertCounterparty = false;

    @Size(max = 200)
    @Column(name = "cp_alert_email", length = 200)
    private String cpAlertEmail;

    // Computed traffic light from utilisationPct vs warning/critical thresholds.
    @Transient
    @JsonProperty
    private String limitIndicator;

    @Transient
    private List<CreditLimitLineItem> lineItems;

    @Transient
    @JsonProperty
    private List<CreditLimitAlert> alerts;

    // FK -> dbo.credit_limit_status_type(credit_limit_status_type_id).
    @Column(name = "status")
    private Integer statusId;

    @Transient
    private String status;

    @Size(max = 100)
    @Column(name = "netting_agreement_ref", length = 100)
    private String nettingAgreementRef;

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

    public Integer getCreditLimitId() {
        return creditLimitId;
    }

    public void setCreditLimitId(Integer creditLimitId) {
        this.creditLimitId = creditLimitId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public Integer getCpCountryId() {
        return cpCountryId;
    }

    public void setCpCountryId(Integer cpCountryId) {
        this.cpCountryId = cpCountryId;
    }

    public String getCountryRiskRating() {
        return countryRiskRating;
    }

    public void setCountryRiskRating(String countryRiskRating) {
        this.countryRiskRating = countryRiskRating;
    }

    public Integer getLimitTypeId() {
        return limitTypeId;
    }

    public void setLimitTypeId(Integer limitTypeId) {
        this.limitTypeId = limitTypeId;
    }

    @JsonProperty("limitType")
    public String getLimitType() {
        return limitType;
    }

    @JsonProperty("limitType")
    public void setLimitType(String limitType) {
        this.limitType = limitType;
    }

    public String getLimitBasis() {
        return limitBasis;
    }

    public void setLimitBasis(String limitBasis) {
        this.limitBasis = limitBasis;
    }

    public Integer getParentLimitId() {
        return parentLimitId;
    }

    public void setParentLimitId(Integer parentLimitId) {
        this.parentLimitId = parentLimitId;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public BigDecimal getLimitAmount() {
        return limitAmount;
    }

    public void setLimitAmount(BigDecimal limitAmount) {
        this.limitAmount = limitAmount;
    }

    public Integer getLimitCurrencyId() {
        return limitCurrencyId;
    }

    public void setLimitCurrencyId(Integer limitCurrencyId) {
        this.limitCurrencyId = limitCurrencyId;
    }

    public BigDecimal getUsedAmount() {
        return usedAmount;
    }

    public void setUsedAmount(BigDecimal usedAmount) {
        this.usedAmount = usedAmount;
    }

    public BigDecimal getAvailableAmount() {
        return availableAmount;
    }

    public void setAvailableAmount(BigDecimal availableAmount) {
        this.availableAmount = availableAmount;
    }

    public BigDecimal getUtilisationPct() {
        return utilisationPct;
    }

    public void setUtilisationPct(BigDecimal utilisationPct) {
        this.utilisationPct = utilisationPct;
    }

    public BigDecimal getCollateralOffset() {
        return collateralOffset;
    }

    public void setCollateralOffset(BigDecimal collateralOffset) {
        this.collateralOffset = collateralOffset;
    }

    public String getCollateralRef() {
        return collateralRef;
    }

    public void setCollateralRef(String collateralRef) {
        this.collateralRef = collateralRef;
    }

    public BigDecimal getTempUpliftAmount() {
        return tempUpliftAmount;
    }

    public void setTempUpliftAmount(BigDecimal tempUpliftAmount) {
        this.tempUpliftAmount = tempUpliftAmount;
    }

    public LocalDate getTempUpliftExpiry() {
        return tempUpliftExpiry;
    }

    public void setTempUpliftExpiry(LocalDate tempUpliftExpiry) {
        this.tempUpliftExpiry = tempUpliftExpiry;
    }

    public Integer getTenorCapMonths() {
        return tenorCapMonths;
    }

    public void setTenorCapMonths(Integer tenorCapMonths) {
        this.tenorCapMonths = tenorCapMonths;
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

    public Integer getCreditAnalystUserId() {
        return creditAnalystUserId;
    }

    public void setCreditAnalystUserId(Integer creditAnalystUserId) {
        this.creditAnalystUserId = creditAnalystUserId;
    }

    public String getCreditAnalystName() {
        return creditAnalystName;
    }

    public void setCreditAnalystName(String creditAnalystName) {
        this.creditAnalystName = creditAnalystName;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDate getApprovalDate() {
        return approvalDate;
    }

    public void setApprovalDate(LocalDate approvalDate) {
        this.approvalDate = approvalDate;
    }

    public Integer getReviewFrequencyDays() {
        return reviewFrequencyDays;
    }

    public void setReviewFrequencyDays(Integer reviewFrequencyDays) {
        this.reviewFrequencyDays = reviewFrequencyDays;
    }

    public LocalDate getLastReviewDate() {
        return lastReviewDate;
    }

    public void setLastReviewDate(LocalDate lastReviewDate) {
        this.lastReviewDate = lastReviewDate;
    }

    public LocalDate getNextReviewDate() {
        return nextReviewDate;
    }

    public void setNextReviewDate(LocalDate nextReviewDate) {
        this.nextReviewDate = nextReviewDate;
    }

    public String getLastReviewOutcome() {
        return lastReviewOutcome;
    }

    public void setLastReviewOutcome(String lastReviewOutcome) {
        this.lastReviewOutcome = lastReviewOutcome;
    }

    public String getInternalRating() {
        return internalRating;
    }

    public void setInternalRating(String internalRating) {
        this.internalRating = internalRating;
    }

    public String getExternalRating() {
        return externalRating;
    }

    public void setExternalRating(String externalRating) {
        this.externalRating = externalRating;
    }

    public BigDecimal getWarningThresholdPct() {
        return warningThresholdPct;
    }

    public void setWarningThresholdPct(BigDecimal warningThresholdPct) {
        this.warningThresholdPct = warningThresholdPct;
    }

    public BigDecimal getCriticalThresholdPct() {
        return criticalThresholdPct;
    }

    public void setCriticalThresholdPct(BigDecimal criticalThresholdPct) {
        this.criticalThresholdPct = criticalThresholdPct;
    }

    public String getBreachAction() {
        return breachAction;
    }

    public void setBreachAction(String breachAction) {
        this.breachAction = breachAction;
    }

    public Boolean getAlertInternal() {
        return alertInternal;
    }

    public void setAlertInternal(Boolean alertInternal) {
        this.alertInternal = alertInternal;
    }

    public Boolean getAlertCounterparty() {
        return alertCounterparty;
    }

    public void setAlertCounterparty(Boolean alertCounterparty) {
        this.alertCounterparty = alertCounterparty;
    }

    public String getCpAlertEmail() {
        return cpAlertEmail;
    }

    public void setCpAlertEmail(String cpAlertEmail) {
        this.cpAlertEmail = cpAlertEmail;
    }

    public String getLimitIndicator() {
        return limitIndicator;
    }

    public void setLimitIndicator(String limitIndicator) {
        this.limitIndicator = limitIndicator;
    }

    public List<CreditLimitLineItem> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<CreditLimitLineItem> lineItems) {
        this.lineItems = lineItems;
    }

    public List<CreditLimitAlert> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<CreditLimitAlert> alerts) {
        this.alerts = alerts;
    }

    public Integer getStatusId() {
        return statusId;
    }

    public void setStatusId(Integer statusId) {
        this.statusId = statusId;
    }

    @JsonProperty("status")
    public String getStatus() {
        return status;
    }

    @JsonProperty("status")
    public void setStatus(String status) {
        this.status = status;
    }

    public String getNettingAgreementRef() {
        return nettingAgreementRef;
    }

    public void setNettingAgreementRef(String nettingAgreementRef) {
        this.nettingAgreementRef = nettingAgreementRef;
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
