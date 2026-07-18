package com.etrm.system.gtc;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.cp_gtc_agreement FKs gtc_version_id, not gtc_id directly — the real
 * schema models gtc (1) -> gtc_version (N), but the frontend's own Gtc type
 * flattens this into one row per GTC with a single version string (see
 * gtc/types.ts's doc comment). CpGtcAgreementService resolves the
 * frontend's gtcId to gtc_version_id via GtcVersion.isCurrent — "the
 * current version of this GTC" — matching that flattening rather than
 * exposing the version table here too.
 *
 * created_by is NOT NULL on the live schema but was previously left
 * completely unmapped, so every POST here 100% failed with a NOT NULL
 * constraint violation (same bug shape documented on Period.java). Fixed
 * with the same @CreatedDate/@CreatedBy field-level JPA-auditing
 * annotations.
 */
@Entity
@Table(name = "cp_gtc_agreement")
@EntityListeners(AuditingEntityListener.class)
public class CpGtcAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cp_gtc_id")
    private Integer cpGtcId;

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

    // Not @NotNull: this is resolved server-side from the client-supplied
    // gtcId by CpGtcAgreementService.resolveGtcVersion() *after* Bean
    // Validation already ran on the incoming request — the client never
    // sends gtc_version_id directly (see the class doc comment). An earlier
    // @NotNull here made every POST/PUT 100% fail with "gtcVersionId must
    // not be null" before the controller method ever ran. Same convention
    // as Period.commodityTypeId / MarginAgreement.agreementTypeId, which
    // are resolved the same way and deliberately have no @NotNull either.
    @Column(name = "gtc_version_id", nullable = false)
    private Integer gtcVersionId;

    @Transient
    private Integer gtcId;

    @Transient
    @JsonProperty
    private String gtcName;

    @Transient
    @JsonProperty
    private String gtcVersion;

    @Column(name = "signed_date")
    private LocalDate signedDate;

    @NotNull
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "document_store_id")
    private Integer documentStoreId;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getCpGtcId() {
        return cpGtcId;
    }

    public void setCpGtcId(Integer cpGtcId) {
        this.cpGtcId = cpGtcId;
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

    public Integer getGtcVersionId() {
        return gtcVersionId;
    }

    public void setGtcVersionId(Integer gtcVersionId) {
        this.gtcVersionId = gtcVersionId;
    }

    @JsonProperty("gtcId")
    public Integer getGtcId() {
        return gtcId;
    }

    @JsonProperty("gtcId")
    public void setGtcId(Integer gtcId) {
        this.gtcId = gtcId;
    }

    public String getGtcName() {
        return gtcName;
    }

    public void setGtcName(String gtcName) {
        this.gtcName = gtcName;
    }

    public String getGtcVersion() {
        return gtcVersion;
    }

    public void setGtcVersion(String gtcVersion) {
        this.gtcVersion = gtcVersion;
    }

    public LocalDate getSignedDate() {
        return signedDate;
    }

    public void setSignedDate(LocalDate signedDate) {
        this.signedDate = signedDate;
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
