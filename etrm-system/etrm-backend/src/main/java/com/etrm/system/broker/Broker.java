package com.etrm.system.broker;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * dbo.broker only ever got created_at (V29), no created_by/updated_at/
 * updated_by.
 *
 * V144 — created_at upgraded from a plain @Column to a real @CreatedDate
 * JPA-auditing field, and created_by/updated_at/updated_by added, matching
 * GlAccount's shape.
 */
@Entity
@Table(name = "broker")
@EntityListeners(AuditingEntityListener.class)
public class Broker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "broker_id")
    private Integer brokerId;

    // V128 — optimistic locking (see LegalEntity.rowVersion doc comment).
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 30)
    @Column(name = "broker_code", nullable = false, length = 30)
    private String brokerCode;

    @NotBlank
    @Size(max = 120)
    @Column(name = "broker_name", nullable = false, length = 120)
    private String brokerName;

    @NotBlank
    @Column(name = "broker_type", nullable = false, length = 10)
    private String brokerType;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @Size(max = 120)
    @Column(name = "contact_name", length = 120)
    private String contactName;

    @Size(max = 200)
    @Column(name = "contact_email", length = 200)
    private String contactEmail;

    @Size(max = 50)
    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Size(max = 255)
    @Column(name = "website", length = 255)
    private String website;

    // FK -> dbo.country(country_id), nullable.
    @Column(name = "country_id")
    private Integer countryId;

    @Size(max = 100)
    @Column(name = "legal_doc_id", length = 100)
    private String legalDocId;

    @Column(name = "commission_uom_id")
    private Integer commissionUomId;

    @Size(max = 1000)
    @Column(name = "commission_notes", length = 1000)
    private String commissionNotes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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

    public Integer getBrokerId() {
        return brokerId;
    }

    public void setBrokerId(Integer brokerId) {
        this.brokerId = brokerId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getBrokerCode() {
        return brokerCode;
    }

    public void setBrokerCode(String brokerCode) {
        this.brokerCode = brokerCode;
    }

    public String getBrokerName() {
        return brokerName;
    }

    public void setBrokerName(String brokerName) {
        this.brokerName = brokerName;
    }

    public String getBrokerType() {
        return brokerType;
    }

    public void setBrokerType(String brokerType) {
        this.brokerType = brokerType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public Integer getCountryId() {
        return countryId;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }

    public String getLegalDocId() {
        return legalDocId;
    }

    public void setLegalDocId(String legalDocId) {
        this.legalDocId = legalDocId;
    }

    public Integer getCommissionUomId() {
        return commissionUomId;
    }

    public void setCommissionUomId(Integer commissionUomId) {
        this.commissionUomId = commissionUomId;
    }

    public String getCommissionNotes() {
        return commissionNotes;
    }

    public void setCommissionNotes(String commissionNotes) {
        this.commissionNotes = commissionNotes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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
