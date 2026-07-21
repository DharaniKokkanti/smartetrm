package com.etrm.system.rinaccount;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * dbo.rin_account — account_type is a PLAIN nvarchar column (no lookup
 * table backs it), values like OBLIGATED_PARTY/RENEWABLE_FUEL_PRODUCER/
 * TRADING/EXPORTER per the frontend comment; treated as a plain String field.
 */
@Entity
@Table(name = "rin_account")
@EntityListeners(AuditingEntityListener.class)
public class RinAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Integer accountId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String entityName;

    @NotBlank
    @Size(max = 40)
    @Column(name = "epa_company_id", nullable = false, length = 40)
    private String epaCompanyId;

    @Size(max = 40)
    @Column(name = "epa_facility_id", length = 40)
    private String epaFacilityId;

    @NotBlank
    @Size(max = 60)
    @Column(name = "account_code", nullable = false, length = 60)
    private String accountCode;

    @NotBlank
    @Size(max = 400)
    @Column(name = "account_name", nullable = false, length = 400)
    private String accountName;

    @NotBlank
    @Size(max = 60)
    @Column(name = "account_type", nullable = false, length = 60)
    private String accountType;

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

    public Integer getAccountId() {
        return accountId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public String getEpaCompanyId() {
        return epaCompanyId;
    }

    public void setEpaCompanyId(String epaCompanyId) {
        this.epaCompanyId = epaCompanyId;
    }

    public String getEpaFacilityId() {
        return epaFacilityId;
    }

    public void setEpaFacilityId(String epaFacilityId) {
        this.epaFacilityId = epaFacilityId;
    }

    public String getAccountCode() {
        return accountCode;
    }

    public void setAccountCode(String accountCode) {
        this.accountCode = accountCode;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
