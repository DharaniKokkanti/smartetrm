package com.etrm.system.country;

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
 * dbo.country originally had no created_at/created_by/updated_at/updated_by
 * columns — added by V86 purpose-built to match the frontend Country type
 * exactly (see the CREATE TABLE comment in
 * database/86_legal_entity_country_fk.sql), which had no audit fields
 * either. V145 closed that gap along with the rest of the batch — all 4
 * standard audit columns added, matching GlAccount's shape.
 */
@Entity
@Table(name = "country")
@EntityListeners(AuditingEntityListener.class)
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "country_id")
    private Integer countryId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    // country_code is CHAR(2), not VARCHAR — Hibernate defaults a String
    // column to varchar, so this needs an explicit columnDefinition or
    // ddl-auto=validate fails at boot ("wrong column type encountered").
    @NotBlank
    @Size(min = 2, max = 2)
    @Column(name = "country_code", nullable = false, length = 2, columnDefinition = "char(2)")
    private String countryCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "country_name", nullable = false, length = 100)
    private String countryName;

    @NotBlank
    @Column(name = "region", nullable = false, length = 20)
    private String region;

    @Column(name = "phone_code", length = 10)
    private String phoneCode;

    @NotBlank
    @Column(name = "fatf_status", nullable = false, length = 20)
    private String fatfStatus;

    @NotBlank
    @Column(name = "sanction_status", nullable = false, length = 20)
    private String sanctionStatus;

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

    public Integer getCountryId() {
        return countryId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getPhoneCode() {
        return phoneCode;
    }

    public void setPhoneCode(String phoneCode) {
        this.phoneCode = phoneCode;
    }

    public String getFatfStatus() {
        return fatfStatus;
    }

    public void setFatfStatus(String fatfStatus) {
        this.fatfStatus = fatfStatus;
    }

    public String getSanctionStatus() {
        return sanctionStatus;
    }

    public void setSanctionStatus(String sanctionStatus) {
        this.sanctionStatus = sanctionStatus;
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
