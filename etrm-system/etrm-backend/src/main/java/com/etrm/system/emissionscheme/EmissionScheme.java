package com.etrm.system.emissionscheme;

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
 * dbo.emission_scheme — scheme_type is an int FK to emission_scheme_type,
 * denormalized to/from the frontend's string "schemeType" (type_code) the
 * same way CarbonRegistry denormalizes registryType.
 *
 * V145 — added created_by/updated_by (this entity previously only had
 * created_at/updated_at); upgraded all 4 audit fields to @CreatedDate/
 * @CreatedBy/@LastModifiedDate/@LastModifiedBy, matching GlAccount's shape.
 */
@Entity
@Table(name = "emission_scheme")
@EntityListeners(AuditingEntityListener.class)
public class EmissionScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scheme_id")
    private Integer schemeId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 60)
    @Column(name = "scheme_code", nullable = false, length = 60)
    private String schemeCode;

    @NotBlank
    @Size(max = 400)
    @Column(name = "scheme_name", nullable = false, length = 400)
    private String schemeName;

    // No @NotNull — client only sends the denormalized code (see @JsonIgnore
    // below); this raw FK id is populated by resolveForeignKeys() AFTER Bean
    // Validation runs, so @NotNull here would reject every real request.
    @Column(name = "scheme_type", nullable = false)
    private Integer schemeType;

    @Transient
    private String schemeTypeCode;

    @Size(max = 400)
    @Column(name = "regulator", length = 400)
    private String regulator;

    @Size(max = 400)
    @Column(name = "jurisdiction", length = 400)
    private String jurisdiction;

    @Column(name = "description", columnDefinition = "nvarchar(max)")
    private String description;

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

    public Integer getSchemeId() {
        return schemeId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setSchemeId(Integer schemeId) {
        this.schemeId = schemeId;
    }

    public String getSchemeCode() {
        return schemeCode;
    }

    public void setSchemeCode(String schemeCode) {
        this.schemeCode = schemeCode;
    }

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
    }

    @JsonIgnore
    public Integer getSchemeType() {
        return schemeType;
    }

    @JsonIgnore
    public void setSchemeType(Integer schemeType) {
        this.schemeType = schemeType;
    }

    @JsonProperty("schemeType")
    public String getSchemeTypeCode() {
        return schemeTypeCode;
    }

    @JsonProperty("schemeType")
    public void setSchemeTypeCode(String schemeTypeCode) {
        this.schemeTypeCode = schemeTypeCode;
    }

    public String getRegulator() {
        return regulator;
    }

    public void setRegulator(String regulator) {
        this.regulator = regulator;
    }

    public String getJurisdiction() {
        return jurisdiction;
    }

    public void setJurisdiction(String jurisdiction) {
        this.jurisdiction = jurisdiction;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
