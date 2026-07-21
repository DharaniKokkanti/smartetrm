package com.etrm.system.carbonregistry;

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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * dbo.carbon_registry — registry_type is an int FK to carbon_registry_type,
 * denormalized to/from the frontend's string "registryType" (type_code) the
 * same way PaymentTerm denormalizes paymentMethod -> paymentMethodCode.
 *
 * V145 — added created_by/updated_by (this dedicated entity had created_at/
 * updated_at but no *_by columns); upgraded created_at/updated_at to real
 * @CreatedDate/@LastModifiedDate fields, matching GlAccount's shape.
 */
@Entity
@Table(name = "carbon_registry")
@EntityListeners(AuditingEntityListener.class)
public class CarbonRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registry_id")
    private Integer registryId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 60)
    @Column(name = "registry_code", nullable = false, length = 60)
    private String registryCode;

    @NotBlank
    @Size(max = 400)
    @Column(name = "registry_name", nullable = false, length = 400)
    private String registryName;

    // No @NotNull here — the client only ever sends the denormalized
    // registryTypeCode string (see @JsonIgnore below); this raw FK id is
    // populated by the service's resolveForeignKeys() AFTER Bean Validation
    // already ran on the deserialized entity, so @NotNull here would reject
    // every real request. The DB's own NOT NULL constraint is the backstop.
    @Column(name = "registry_type", nullable = false)
    private Integer registryType;

    @Transient
    @JsonProperty
    private String registryTypeCode;

    @Size(max = 400)
    @Column(name = "operator", length = 400)
    private String operator;

    @Size(max = 1000)
    @Column(name = "website", length = 1000)
    private String website;

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

    public Integer getRegistryId() {
        return registryId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setRegistryId(Integer registryId) {
        this.registryId = registryId;
    }

    public String getRegistryCode() {
        return registryCode;
    }

    public void setRegistryCode(String registryCode) {
        this.registryCode = registryCode;
    }

    public String getRegistryName() {
        return registryName;
    }

    public void setRegistryName(String registryName) {
        this.registryName = registryName;
    }

    @JsonIgnore
    public Integer getRegistryType() {
        return registryType;
    }

    @JsonIgnore
    public void setRegistryType(Integer registryType) {
        this.registryType = registryType;
    }

    @JsonProperty("registryType")
    public String getRegistryTypeCode() {
        return registryTypeCode;
    }

    @JsonProperty("registryType")
    public void setRegistryTypeCode(String registryTypeCode) {
        this.registryTypeCode = registryTypeCode;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
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
