package com.etrm.system.gtc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Upgraded in place (getters were read-only; setters added) so GtcService
 * can create/update the "current version" row backing the frontend's
 * flattened version/effectiveDate/expiryDate/documentRef fields — see
 * Gtc.java's doc comment for the flattening rationale.
 */
@Entity
@Table(name = "gtc_version")
public class GtcVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gtc_version_id")
    private Integer gtcVersionId;

    // V129 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "gtc_id", nullable = false)
    private Integer gtcId;

    @Column(name = "version_number", nullable = false, length = 20)
    private String versionNumber;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "superseded_date")
    private LocalDate supersededDate;

    @Column(name = "summary_of_changes", length = 1000)
    private String summaryOfChanges;

    @Column(name = "document_store_id")
    private Integer documentStoreId;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    public Integer getGtcVersionId() {
        return gtcVersionId;
    }

    public void setGtcVersionId(Integer gtcVersionId) {
        this.gtcVersionId = gtcVersionId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getGtcId() {
        return gtcId;
    }

    public void setGtcId(Integer gtcId) {
        this.gtcId = gtcId;
    }

    public String getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(String versionNumber) {
        this.versionNumber = versionNumber;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public LocalDate getSupersededDate() {
        return supersededDate;
    }

    public void setSupersededDate(LocalDate supersededDate) {
        this.supersededDate = supersededDate;
    }

    public String getSummaryOfChanges() {
        return summaryOfChanges;
    }

    public void setSummaryOfChanges(String summaryOfChanges) {
        this.summaryOfChanges = summaryOfChanges;
    }

    public Integer getDocumentStoreId() {
        return documentStoreId;
    }

    public void setDocumentStoreId(Integer documentStoreId) {
        this.documentStoreId = documentStoreId;
    }

    public Boolean getIsCurrent() {
        return isCurrent;
    }

    public void setIsCurrent(Boolean isCurrent) {
        this.isCurrent = isCurrent;
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
