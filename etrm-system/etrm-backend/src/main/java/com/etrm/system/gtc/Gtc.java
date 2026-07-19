package com.etrm.system.gtc;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Upgraded in place from the read-only reader (see prior doc comment, kept
 * below in spirit) into the full entity behind /api/v1/gtcs. dbo.gtc (1) ->
 * dbo.gtc_version (N); the frontend's Gtc type flattens this into one row
 * per GTC with version/effectiveDate/expiryDate/documentRef fields that
 * live on gtc_version, not gtc itself — GtcService resolves the *current*
 * version (gtc_version.is_current) and flattens its fields onto this
 * entity's @Transient properties. There is no real "expiry date" column on
 * gtc_version (only effective_date + superseded_date, i.e. when a version
 * was replaced) — expiryDate is mapped from superseded_date as the closest
 * semantic match; it will be null for any current version, which is the
 * common case. documentRef is mapped from gtc_version.document_store_id
 * (no DocumentStore entity exists yet in this codebase to resolve a real
 * file name, so the raw id is surfaced as a string). dbo.gtc itself has no
 * gtc_type column — commodity_type is the closest real column and is
 * surfaced under the frontend's `gtcType` JSON name. gtc has no
 * updated_at/updated_by (verified live via sys.columns).
 */
@Entity
@Table(name = "gtc")
public class Gtc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gtc_id")
    private Integer gtcId;

    // V129 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 30)
    @Column(name = "gtc_code", nullable = false, length = 30)
    private String gtcCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "gtc_name", nullable = false, length = 200)
    private String gtcName;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    @JsonProperty("gtcType")
    private String commodityType;

    @Transient
    @JsonProperty
    private String version;

    @Transient
    @JsonProperty
    private LocalDate effectiveDate;

    @Transient
    @JsonProperty
    private LocalDate expiryDate;

    @Transient
    @JsonProperty
    private String documentRef;

    @Size(max = 100)
    @Column(name = "governing_law", length = 100)
    private String governingLaw;

    @Size(max = 100)
    @Column(name = "dispute_resolution", length = 100)
    private String disputeResolution;

    @Column(name = "jurisdiction_id")
    private Integer jurisdictionId;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @NotBlank
    @Size(max = 100)
    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    public Integer getGtcId() {
        return gtcId;
    }

    public void setGtcId(Integer gtcId) {
        this.gtcId = gtcId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getGtcCode() {
        return gtcCode;
    }

    public void setGtcCode(String gtcCode) {
        this.gtcCode = gtcCode;
    }

    public String getGtcName() {
        return gtcName;
    }

    public void setGtcName(String gtcName) {
        this.gtcName = gtcName;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getDocumentRef() {
        return documentRef;
    }

    public void setDocumentRef(String documentRef) {
        this.documentRef = documentRef;
    }

    public String getGoverningLaw() {
        return governingLaw;
    }

    public void setGoverningLaw(String governingLaw) {
        this.governingLaw = governingLaw;
    }

    public String getDisputeResolution() {
        return disputeResolution;
    }

    public void setDisputeResolution(String disputeResolution) {
        this.disputeResolution = disputeResolution;
    }

    public Integer getJurisdictionId() {
        return jurisdictionId;
    }

    public void setJurisdictionId(Integer jurisdictionId) {
        this.jurisdictionId = jurisdictionId;
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
}
