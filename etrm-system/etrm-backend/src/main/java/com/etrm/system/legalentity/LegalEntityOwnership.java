package com.etrm.system.legalentity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.legal_entity_ownership (V125) — a joint-venture legal_entity's
 * ownership cap table: 2+ owner rows, each an ownership percentage plus an
 * operator flag and a per-owner consolidation method. Owner is one of three
 * cases (ownerType): LEGAL_ENTITY / COUNTERPARTY resolve via ownerRefId,
 * EXTERNAL uses the free-text externalOwnerName fallback. Only
 * created_at/created_by (no updated columns) — same shape as
 * BookClassification/BookTrader, does not extend AuditableEntity.
 */
@Entity
@Table(name = "legal_entity_ownership")
public class LegalEntityOwnership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ownership_id")
    private Integer ownershipId;

    @NotNull
    @Column(name = "jv_entity_id", nullable = false)
    private Integer jvEntityId;

    @NotBlank
    @Column(name = "owner_type", nullable = false, length = 20)
    private String ownerType;

    @Column(name = "owner_ref_id")
    private Integer ownerRefId;

    @Size(max = 200)
    @Column(name = "external_owner_name", length = 200)
    private String externalOwnerName;

    @Transient
    @JsonProperty
    private String ownerDisplayName;

    @NotNull
    @Column(name = "ownership_pct", nullable = false, precision = 6, scale = 3)
    private BigDecimal ownershipPct;

    @NotNull
    @Column(name = "is_operator", nullable = false)
    private Boolean isOperator = false;

    @NotBlank
    @Column(name = "consolidation_method", nullable = false, length = 20)
    private String consolidationMethod = "EQUITY";

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (effectiveFrom == null) effectiveFrom = LocalDate.now();
    }

    public Integer getOwnershipId() {
        return ownershipId;
    }

    public void setOwnershipId(Integer ownershipId) {
        this.ownershipId = ownershipId;
    }

    public Integer getJvEntityId() {
        return jvEntityId;
    }

    public void setJvEntityId(Integer jvEntityId) {
        this.jvEntityId = jvEntityId;
    }

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
    }

    public Integer getOwnerRefId() {
        return ownerRefId;
    }

    public void setOwnerRefId(Integer ownerRefId) {
        this.ownerRefId = ownerRefId;
    }

    public String getExternalOwnerName() {
        return externalOwnerName;
    }

    public void setExternalOwnerName(String externalOwnerName) {
        this.externalOwnerName = externalOwnerName;
    }

    public String getOwnerDisplayName() {
        return ownerDisplayName;
    }

    public void setOwnerDisplayName(String ownerDisplayName) {
        this.ownerDisplayName = ownerDisplayName;
    }

    public BigDecimal getOwnershipPct() {
        return ownershipPct;
    }

    public void setOwnershipPct(BigDecimal ownershipPct) {
        this.ownershipPct = ownershipPct;
    }

    public Boolean getIsOperator() {
        return isOperator;
    }

    public void setIsOperator(Boolean isOperator) {
        this.isOperator = isOperator;
    }

    public String getConsolidationMethod() {
        return consolidationMethod;
    }

    public void setConsolidationMethod(String consolidationMethod) {
        this.consolidationMethod = consolidationMethod;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
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
