package com.etrm.system.taxregistration;

import com.etrm.system.common.AuditableEntity;
import com.etrm.system.polymorphic.EntityType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Polymorphic, same pattern as EntityAddress/EntityContact
 * (com.etrm.system.polymorphic) — reuses the same EntityType enum
 * (LEGAL_ENTITY/COUNTERPARTY/BROKER). entity_id is genuinely INT here
 * (confirmed against the real schema), unlike EntityAddress/EntityContact's
 * Long — not unified with those, just mapped correctly for this table.
 */
@Entity
@Table(name = "tax_registration")
public class TaxRegistration extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tax_reg_id")
    private Integer taxRegId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    private EntityType entityType;

    @NotNull
    @Column(name = "entity_id", nullable = false)
    private Integer entityId;

    // FK -> dbo.tax_type(tax_type_id) — already a plain numeric id on the
    // frontend (TaxType = number), no translation needed.
    @NotNull
    @Column(name = "tax_type", nullable = false)
    private Integer taxType;

    @NotBlank
    @Size(max = 50)
    @Column(name = "tax_id", nullable = false, length = 50)
    private String taxId;

    // FK -> dbo.country(country_id).
    @NotNull
    @Column(name = "jurisdiction_id", nullable = false)
    private Integer jurisdictionId;

    @Size(max = 100)
    @Column(name = "issuing_authority", length = 100)
    private String issuingAuthority;

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @NotNull
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getTaxRegId() {
        return taxRegId;
    }

    public void setTaxRegId(Integer taxRegId) {
        this.taxRegId = taxRegId;
    }

    public EntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(EntityType entityType) {
        this.entityType = entityType;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    public Integer getTaxType() {
        return taxType;
    }

    public void setTaxType(Integer taxType) {
        this.taxType = taxType;
    }

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }

    public Integer getJurisdictionId() {
        return jurisdictionId;
    }

    public void setJurisdictionId(Integer jurisdictionId) {
        this.jurisdictionId = jurisdictionId;
    }

    public String getIssuingAuthority() {
        return issuingAuthority;
    }

    public void setIssuingAuthority(String issuingAuthority) {
        this.issuingAuthority = issuingAuthority;
    }

    public LocalDate getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDate registrationDate) {
        this.registrationDate = registrationDate;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDate validTo) {
        this.validTo = validTo;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
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
