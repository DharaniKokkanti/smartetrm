package com.etrm.system.emissionscheme;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * dbo.emission_scheme — scheme_type is an int FK to emission_scheme_type,
 * denormalized to/from the frontend's string "schemeType" (type_code) the
 * same way CarbonRegistry denormalizes registryType.
 */
@Entity
@Table(name = "emission_scheme")
public class EmissionScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scheme_id")
    private Integer schemeId;

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

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getSchemeId() {
        return schemeId;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
