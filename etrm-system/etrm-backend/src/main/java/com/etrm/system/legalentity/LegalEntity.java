package com.etrm.system.legalentity;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Entity
@Table(name = "legal_entity")
public class LegalEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "legal_entity_id")
    private Long legalEntityId;

    @NotBlank
    @Size(max = 20)
    @Column(name = "entity_code", nullable = false, length = 20)
    private String entityCode;

    @NotBlank
    @Column(name = "entity_name", nullable = false, length = 200)
    private String entityName;

    @NotBlank
    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(name = "lei_code", length = 20)
    private String leiCode;

    @NotBlank
    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;

    @Column(name = "parent_entity_id")
    private Long parentEntityId;

    @NotBlank
    @Size(min = 2, max = 2)
    @Column(name = "jurisdiction", nullable = false, length = 2)
    private String jurisdiction;

    @Size(min = 2, max = 2)
    @Column(name = "incorporation_country", length = 2)
    private String incorporationCountry;

    @Column(name = "incorporation_number", length = 100)
    private String incorporationNumber;

    @NotBlank
    @Size(min = 3, max = 3)
    @Column(name = "base_currency", nullable = false, length = 3)
    private String baseCurrency;

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

    public Long getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Long legalEntityId) {
        this.legalEntityId = legalEntityId;
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

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Long getParentEntityId() {
        return parentEntityId;
    }

    public void setParentEntityId(Long parentEntityId) {
        this.parentEntityId = parentEntityId;
    }

    public String getJurisdiction() {
        return jurisdiction;
    }

    public void setJurisdiction(String jurisdiction) {
        this.jurisdiction = jurisdiction;
    }

    public String getIncorporationCountry() {
        return incorporationCountry;
    }

    public void setIncorporationCountry(String incorporationCountry) {
        this.incorporationCountry = incorporationCountry;
    }

    public String getIncorporationNumber() {
        return incorporationNumber;
    }

    public void setIncorporationNumber(String incorporationNumber) {
        this.incorporationNumber = incorporationNumber;
    }

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public void setBaseCurrency(String baseCurrency) {
        this.baseCurrency = baseCurrency;
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
