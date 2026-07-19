package com.etrm.system.legalentity;

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

import java.time.LocalDate;

@Entity
@Table(name = "legal_entity")
public class LegalEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "legal_entity_id")
    private Integer legalEntityId;

    // V127 — optimistic locking. Hibernate increments this on every UPDATE
    // and includes it in the WHERE clause; a stale write (row_version
    // already bumped by someone else) matches zero rows and throws
    // ObjectOptimisticLockingFailureException (-> 409, GlobalExceptionHandler)
    // instead of silently overwriting a concurrent edit.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 20)
    @Column(name = "entity_code", nullable = false, length = 20)
    private String entityCode;

    @NotBlank
    @Column(name = "entity_name", nullable = false, length = 200)
    private String entityName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(name = "lei_code", length = 20)
    private String leiCode;

    // entity_type became an INT FK to dbo.legal_entity_type (code-to-id
    // conversion sweep) — was VARCHAR(30) at this entity's original authoring.
    @NotNull
    @Column(name = "entity_type", nullable = false)
    private Integer entityType;

    @Column(name = "parent_entity_id")
    private Integer parentEntityId;

    // Added by V62 alongside a CHECK enforcing it agrees with parentEntityId.
    @NotNull
    @Column(name = "parent_ind", nullable = false)
    private Boolean parentInd = false;

    // jurisdiction (CHAR(2)) -> jurisdiction_id (FK dbo.country) (V95)
    @NotNull
    @Column(name = "jurisdiction_id", nullable = false)
    private Integer jurisdictionId;

    // incorporation_country (CHAR(2)) -> incorporation_country_id (FK dbo.country) (V95)
    @Column(name = "incorporation_country_id")
    private Integer incorporationCountryId;

    @Column(name = "incorporation_number", length = 50)
    private String incorporationNumber;

    // base_currency (CHAR(3)) -> base_currency_id (FK dbo.currency) (V95)
    @NotNull
    @Column(name = "base_currency_id", nullable = false)
    private Integer baseCurrencyId;

    @Column(name = "default_timezone", length = 50)
    private String defaultTimezone;

    @Column(name = "regulator", length = 100)
    private String regulator;

    @Column(name = "regulatory_licence", length = 100)
    private String regulatoryLicence;

    @Column(name = "is_internal", nullable = false)
    private Boolean isInternal = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "go_live_date")
    private LocalDate goLiveDate;

    @Column(name = "deactivated_date")
    private LocalDate deactivatedDate;

    @Column(name = "notes", length = 1000)
    private String notes;

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getEntityCode() {
        return entityCode;
    }

    public void setEntityCode(String entityCode) {
        this.entityCode = entityCode;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
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

    public Integer getEntityType() {
        return entityType;
    }

    public void setEntityType(Integer entityType) {
        this.entityType = entityType;
    }

    public Integer getParentEntityId() {
        return parentEntityId;
    }

    public void setParentEntityId(Integer parentEntityId) {
        this.parentEntityId = parentEntityId;
    }

    public Boolean getParentInd() {
        return parentInd;
    }

    public void setParentInd(Boolean parentInd) {
        this.parentInd = parentInd;
    }

    public Integer getJurisdictionId() {
        return jurisdictionId;
    }

    public void setJurisdictionId(Integer jurisdictionId) {
        this.jurisdictionId = jurisdictionId;
    }

    public Integer getIncorporationCountryId() {
        return incorporationCountryId;
    }

    public void setIncorporationCountryId(Integer incorporationCountryId) {
        this.incorporationCountryId = incorporationCountryId;
    }

    public String getIncorporationNumber() {
        return incorporationNumber;
    }

    public void setIncorporationNumber(String incorporationNumber) {
        this.incorporationNumber = incorporationNumber;
    }

    public Integer getBaseCurrencyId() {
        return baseCurrencyId;
    }

    public void setBaseCurrencyId(Integer baseCurrencyId) {
        this.baseCurrencyId = baseCurrencyId;
    }

    public String getDefaultTimezone() {
        return defaultTimezone;
    }

    public void setDefaultTimezone(String defaultTimezone) {
        this.defaultTimezone = defaultTimezone;
    }

    public String getRegulator() {
        return regulator;
    }

    public void setRegulator(String regulator) {
        this.regulator = regulator;
    }

    public String getRegulatoryLicence() {
        return regulatoryLicence;
    }

    public void setRegulatoryLicence(String regulatoryLicence) {
        this.regulatoryLicence = regulatoryLicence;
    }

    public Boolean getIsInternal() {
        return isInternal;
    }

    public void setIsInternal(Boolean isInternal) {
        this.isInternal = isInternal;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDate getGoLiveDate() {
        return goLiveDate;
    }

    public void setGoLiveDate(LocalDate goLiveDate) {
        this.goLiveDate = goLiveDate;
    }

    public LocalDate getDeactivatedDate() {
        return deactivatedDate;
    }

    public void setDeactivatedDate(LocalDate deactivatedDate) {
        this.deactivatedDate = deactivatedDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
