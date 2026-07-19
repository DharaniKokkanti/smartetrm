package com.etrm.system.nettingagreement;

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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.netting_agreement only ever got created_at/created_by, no
 * updated_at/updated_by — matches the frontend NettingAgreement type,
 * which only has createdAt. Does not extend AuditableEntity, but created_by
 * is still NOT NULL on the live schema, so it's mapped here with the same
 * @CreatedDate/@CreatedBy field-level JPA-auditing annotations PeriodField
 * uses (see Period.java's doc comment) — an earlier version of this entity
 * left created_by completely unmapped, which made every POST here 100% fail
 * with a NOT NULL constraint violation.
 */
@Entity
@Table(name = "netting_agreement")
@EntityListeners(AuditingEntityListener.class)
public class NettingAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "netting_id")
    private Integer nettingId;

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
    @Column(name = "counterparty_id", nullable = false)
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    // FK -> dbo.netting_agreement_type(netting_agreement_type_id) — already
    // a plain numeric id on the frontend (NettingAgreementType = number),
    // no translation needed.
    @NotNull
    @Column(name = "agreement_type", nullable = false)
    private Integer agreementType;

    @Size(max = 100)
    @Column(name = "agreement_ref", length = 100)
    private String agreementRef;

    @NotNull
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getNettingId() {
        return nettingId;
    }

    public void setNettingId(Integer nettingId) {
        this.nettingId = nettingId;
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

    public Integer getAgreementType() {
        return agreementType;
    }

    public void setAgreementType(Integer agreementType) {
        this.agreementType = agreementType;
    }

    public String getAgreementRef() {
        return agreementRef;
    }

    public void setAgreementRef(String agreementRef) {
        this.agreementRef = agreementRef;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public LocalDate getTerminationDate() {
        return terminationDate;
    }

    public void setTerminationDate(LocalDate terminationDate) {
        this.terminationDate = terminationDate;
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
}
