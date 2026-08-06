package com.etrm.system.licenseregistration;

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
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Polymorphic, same pattern as TaxRegistration (see that class's doc
 * comment) — entity_type/entity_id link to a legal_entity or counterparty.
 * V187: country_id (jurisdiction) + regionState (state/province, free text —
 * no state master table yet) since license jurisdiction isn't always just
 * country-level (e.g. FERC vs. state PUC broker licenses in the US).
 */
@Entity
@Table(name = "license_registration")
public class LicenseRegistration extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "license_reg_id")
    private Integer licenseRegId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    private EntityType entityType;

    @NotNull
    @Column(name = "entity_id", nullable = false)
    private Integer entityId;

    // FK -> dbo.license_type(license_type_id).
    @NotNull
    @Column(name = "license_type_id", nullable = false)
    private Integer licenseTypeId;

    @NotBlank
    @Size(max = 50)
    @Column(name = "license_number", nullable = false, length = 50)
    private String licenseNumber;

    // FK -> dbo.country(country_id) — jurisdiction.
    @NotNull
    @Column(name = "country_id", nullable = false)
    private Integer countryId;

    @Size(max = 100)
    @Column(name = "region_state", length = 100)
    private String regionState;

    @Size(max = 100)
    @Column(name = "issuing_authority", length = 100)
    private String issuingAuthority;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @NotBlank
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @NotNull
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getLicenseRegId() {
        return licenseRegId;
    }

    public void setLicenseRegId(Integer licenseRegId) {
        this.licenseRegId = licenseRegId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public Integer getLicenseTypeId() {
        return licenseTypeId;
    }

    public void setLicenseTypeId(Integer licenseTypeId) {
        this.licenseTypeId = licenseTypeId;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public Integer getCountryId() {
        return countryId;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }

    public String getRegionState() {
        return regionState;
    }

    public void setRegionState(String regionState) {
        this.regionState = regionState;
    }

    public String getIssuingAuthority() {
        return issuingAuthority;
    }

    public void setIssuingAuthority(String issuingAuthority) {
        this.issuingAuthority = issuingAuthority;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
