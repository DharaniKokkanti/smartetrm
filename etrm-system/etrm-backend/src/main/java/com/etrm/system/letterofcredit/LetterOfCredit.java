package com.etrm.system.letterofcredit;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.letter_of_credit only ever got created_at/updated_at, no created_by/
 * updated_by. lc_type/status FK dedicated tables (dbo.lc_type/
 * dbo.lc_status_type) — frontend sends/receives their string type_code,
 * translated by LetterOfCreditService (same pattern as Book.bookType).
 */
@Entity
@Table(name = "letter_of_credit")
public class LetterOfCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lc_id")
    private Integer lcId;

    // V128 — optimistic locking (see LegalEntity.rowVersion doc comment).
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 80)
    @Column(name = "lc_reference", nullable = false, length = 80)
    private String lcReference;

    // FK -> dbo.lc_type(lc_type_id). Frontend sends/receives type_code.
    @Column(name = "lc_type")
    private Integer lcTypeId;

    @Transient
    private String lcType;

    // FK -> dbo.lc_status_type(lc_status_type_id). Frontend sends/receives type_code.
    @Column(name = "status")
    private Integer statusId;

    @Transient
    private String status;

    @NotNull
    @Column(name = "counterparty_id", nullable = false)
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @NotNull
    @Column(name = "beneficiary_entity_id", nullable = false)
    private Integer beneficiaryEntityId;

    @Transient
    @JsonProperty
    private String beneficiaryEntityName;

    @NotBlank
    @Size(max = 150)
    @Column(name = "issuing_bank_name", nullable = false, length = 150)
    private String issuingBankName;

    // NCHAR(11), not NVARCHAR — needs explicit columnDefinition or
    // ddl-auto=validate fails (same gotcha as Country/Currency's CHAR codes).
    @Size(max = 11)
    @Column(name = "issuing_bank_bic", length = 11, columnDefinition = "nchar(11)")
    private String issuingBankBic;

    @Size(max = 150)
    @Column(name = "confirming_bank_name", length = 150)
    private String confirmingBankName;

    @NotNull
    @Column(name = "lc_amount", nullable = false)
    private BigDecimal lcAmount;

    @NotNull
    @Column(name = "lc_currency_id", nullable = false)
    private Integer lcCurrencyId;

    @NotNull
    @Column(name = "issued_amount", nullable = false)
    private BigDecimal issuedAmount;

    @NotNull
    @Column(name = "drawdown_amount", nullable = false)
    private BigDecimal drawdownAmount = BigDecimal.ZERO;

    // Computed: lcAmount - drawdownAmount. Not stored.
    @Transient
    @JsonProperty
    private BigDecimal availableAmount;

    @NotNull
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @NotNull
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    // SMALLINT -> Short.
    @Column(name = "presentation_deadline_days")
    private Short presentationDeadlineDays;

    @NotNull
    @Column(name = "is_evergreen", nullable = false)
    private Boolean isEvergreen = false;

    // SMALLINT -> Short.
    @Column(name = "auto_renewal_days")
    private Short autoRenewalDays;

    @Size(max = 80)
    @Column(name = "place_of_expiry", length = 80)
    private String placeOfExpiry;

    @Size(max = 50)
    @Column(name = "applicable_law", length = 50)
    private String applicableLaw;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getLcId() {
        return lcId;
    }

    public void setLcId(Integer lcId) {
        this.lcId = lcId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getLcReference() {
        return lcReference;
    }

    public void setLcReference(String lcReference) {
        this.lcReference = lcReference;
    }

    public Integer getLcTypeId() {
        return lcTypeId;
    }

    public void setLcTypeId(Integer lcTypeId) {
        this.lcTypeId = lcTypeId;
    }

    @JsonProperty("lcType")
    public String getLcType() {
        return lcType;
    }

    @JsonProperty("lcType")
    public void setLcType(String lcType) {
        this.lcType = lcType;
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

    public Integer getBeneficiaryEntityId() {
        return beneficiaryEntityId;
    }

    public void setBeneficiaryEntityId(Integer beneficiaryEntityId) {
        this.beneficiaryEntityId = beneficiaryEntityId;
    }

    public String getBeneficiaryEntityName() {
        return beneficiaryEntityName;
    }

    public void setBeneficiaryEntityName(String beneficiaryEntityName) {
        this.beneficiaryEntityName = beneficiaryEntityName;
    }

    public String getIssuingBankName() {
        return issuingBankName;
    }

    public void setIssuingBankName(String issuingBankName) {
        this.issuingBankName = issuingBankName;
    }

    public String getIssuingBankBic() {
        return issuingBankBic;
    }

    public void setIssuingBankBic(String issuingBankBic) {
        this.issuingBankBic = issuingBankBic;
    }

    public String getConfirmingBankName() {
        return confirmingBankName;
    }

    public void setConfirmingBankName(String confirmingBankName) {
        this.confirmingBankName = confirmingBankName;
    }

    public BigDecimal getLcAmount() {
        return lcAmount;
    }

    public void setLcAmount(BigDecimal lcAmount) {
        this.lcAmount = lcAmount;
    }

    public Integer getLcCurrencyId() {
        return lcCurrencyId;
    }

    public void setLcCurrencyId(Integer lcCurrencyId) {
        this.lcCurrencyId = lcCurrencyId;
    }

    public BigDecimal getIssuedAmount() {
        return issuedAmount;
    }

    public void setIssuedAmount(BigDecimal issuedAmount) {
        this.issuedAmount = issuedAmount;
    }

    public BigDecimal getDrawdownAmount() {
        return drawdownAmount;
    }

    public void setDrawdownAmount(BigDecimal drawdownAmount) {
        this.drawdownAmount = drawdownAmount;
    }

    public BigDecimal getAvailableAmount() {
        return availableAmount;
    }

    public void setAvailableAmount(BigDecimal availableAmount) {
        this.availableAmount = availableAmount;
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

    public Short getPresentationDeadlineDays() {
        return presentationDeadlineDays;
    }

    public void setPresentationDeadlineDays(Short presentationDeadlineDays) {
        this.presentationDeadlineDays = presentationDeadlineDays;
    }

    public Boolean getIsEvergreen() {
        return isEvergreen;
    }

    public void setIsEvergreen(Boolean isEvergreen) {
        this.isEvergreen = isEvergreen;
    }

    public Short getAutoRenewalDays() {
        return autoRenewalDays;
    }

    public void setAutoRenewalDays(Short autoRenewalDays) {
        this.autoRenewalDays = autoRenewalDays;
    }

    public String getPlaceOfExpiry() {
        return placeOfExpiry;
    }

    public void setPlaceOfExpiry(String placeOfExpiry) {
        this.placeOfExpiry = placeOfExpiry;
    }

    public String getApplicableLaw() {
        return applicableLaw;
    }

    public void setApplicableLaw(String applicableLaw) {
        this.applicableLaw = applicableLaw;
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
}
