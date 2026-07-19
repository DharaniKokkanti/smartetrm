package com.etrm.system.counterparty;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "counterparty")
public class Counterparty extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "counterparty_id")
    private Integer counterpartyId;

    // V127 — optimistic locking, see LegalEntity.rowVersion for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 20)
    @Column(name = "cp_code", nullable = false, length = 20)
    private String cpCode;

    @NotBlank
    @Column(name = "legal_name", nullable = false, length = 300)
    private String legalName;

    @NotBlank
    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(name = "lei_code", length = 20)
    private String leiCode;

    // jurisdiction (CHAR(2)) -> jurisdiction_id (FK dbo.country) (V95)
    @NotNull
    @Column(name = "jurisdiction_id", nullable = false)
    private Integer jurisdictionId;

    // cp_type became an INT FK to dbo.counterparty_type (code-to-id
    // conversion sweep) — was VARCHAR(20) at this entity's original authoring.
    @NotNull
    @Column(name = "cp_type", nullable = false)
    private Integer cpType;

    @Column(name = "credit_rating_id")
    private Integer creditRatingId;

    @Column(name = "credit_limit", precision = 18, scale = 2)
    private BigDecimal creditLimit;

    // credit_limit_currency (CHAR(3)) -> credit_limit_currency_id (FK dbo.currency) (V95)
    @NotNull
    @Column(name = "credit_limit_currency_id", nullable = false)
    private Integer creditLimitCurrencyId;

    @Column(name = "credit_review_date")
    private LocalDate creditReviewDate;

    // TINYINT in the DB — Hibernate maps java.lang.Short (not Integer) to
    // TINYINT under the SQL Server dialect.
    @Column(name = "settlement_days", nullable = false)
    private Short settlementDays = 2;

    @Column(name = "default_currency_id")
    private Integer defaultCurrencyId;

    @Column(name = "is_intercompany", nullable = false)
    private Boolean isIntercompany = false;

    @Column(name = "internal_entity_id")
    private Integer internalEntityId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // kyc_status became an INT FK to dbo.kyc_status (code-to-id conversion
    // sweep) — was VARCHAR(20) at this entity's original authoring.
    @NotNull
    @Column(name = "kyc_status", nullable = false)
    private Integer kycStatus;

    @Column(name = "kyc_approved_date")
    private LocalDate kycApprovedDate;

    @Column(name = "kyc_expiry_date")
    private LocalDate kycExpiryDate;

    @Column(name = "onboarded_date")
    private LocalDate onboardedDate;

    @Column(name = "deactivated_date")
    private LocalDate deactivatedDate;

    @NotNull
    @Column(name = "parent_ind", nullable = false)
    private Boolean parentInd = false;

    @Column(name = "parent_counterparty_id")
    private Integer parentCounterpartyId;

    @Column(name = "notes", length = 1000)
    private String notes;

    public Integer getCounterpartyId() {
        return counterpartyId;
    }

    public void setCounterpartyId(Integer counterpartyId) {
        this.counterpartyId = counterpartyId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getCpCode() {
        return cpCode;
    }

    public void setCpCode(String cpCode) {
        this.cpCode = cpCode;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getLeiCode() {
        return leiCode;
    }

    public void setLeiCode(String leiCode) {
        this.leiCode = leiCode;
    }

    public Integer getJurisdictionId() {
        return jurisdictionId;
    }

    public void setJurisdictionId(Integer jurisdictionId) {
        this.jurisdictionId = jurisdictionId;
    }

    public Integer getCpType() {
        return cpType;
    }

    public void setCpType(Integer cpType) {
        this.cpType = cpType;
    }

    public Integer getCreditRatingId() {
        return creditRatingId;
    }

    public void setCreditRatingId(Integer creditRatingId) {
        this.creditRatingId = creditRatingId;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public Integer getCreditLimitCurrencyId() {
        return creditLimitCurrencyId;
    }

    public void setCreditLimitCurrencyId(Integer creditLimitCurrencyId) {
        this.creditLimitCurrencyId = creditLimitCurrencyId;
    }

    public LocalDate getCreditReviewDate() {
        return creditReviewDate;
    }

    public void setCreditReviewDate(LocalDate creditReviewDate) {
        this.creditReviewDate = creditReviewDate;
    }

    public Short getSettlementDays() {
        return settlementDays;
    }

    public void setSettlementDays(Short settlementDays) {
        this.settlementDays = settlementDays;
    }

    public Integer getDefaultCurrencyId() {
        return defaultCurrencyId;
    }

    public void setDefaultCurrencyId(Integer defaultCurrencyId) {
        this.defaultCurrencyId = defaultCurrencyId;
    }

    public Boolean getIsIntercompany() {
        return isIntercompany;
    }

    public void setIsIntercompany(Boolean isIntercompany) {
        this.isIntercompany = isIntercompany;
    }

    public Integer getInternalEntityId() {
        return internalEntityId;
    }

    public void setInternalEntityId(Integer internalEntityId) {
        this.internalEntityId = internalEntityId;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(Integer kycStatus) {
        this.kycStatus = kycStatus;
    }

    public LocalDate getKycApprovedDate() {
        return kycApprovedDate;
    }

    public void setKycApprovedDate(LocalDate kycApprovedDate) {
        this.kycApprovedDate = kycApprovedDate;
    }

    public LocalDate getKycExpiryDate() {
        return kycExpiryDate;
    }

    public void setKycExpiryDate(LocalDate kycExpiryDate) {
        this.kycExpiryDate = kycExpiryDate;
    }

    public LocalDate getOnboardedDate() {
        return onboardedDate;
    }

    public void setOnboardedDate(LocalDate onboardedDate) {
        this.onboardedDate = onboardedDate;
    }

    public LocalDate getDeactivatedDate() {
        return deactivatedDate;
    }

    public void setDeactivatedDate(LocalDate deactivatedDate) {
        this.deactivatedDate = deactivatedDate;
    }

    public Boolean getParentInd() {
        return parentInd;
    }

    public void setParentInd(Boolean parentInd) {
        this.parentInd = parentInd;
    }

    public Integer getParentCounterpartyId() {
        return parentCounterpartyId;
    }

    public void setParentCounterpartyId(Integer parentCounterpartyId) {
        this.parentCounterpartyId = parentCounterpartyId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
