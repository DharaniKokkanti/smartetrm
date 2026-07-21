package com.etrm.system.regulatoryobligation;

import com.fasterxml.jackson.annotation.JsonProperty;
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
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.regulatory_obligation already existed live with real data (an earlier
 * session's ReferenceDataCrudSmokeTest sweep tripped its CHECK constraints,
 * confirming the table) but had no dedicated controller — the frontend's
 * own dedicated page (features/contracts/regulatory-obligations) called
 * /compliance/obligations expecting one, 404ing against the real backend.
 * Column names inferred from this schema's established short-FK convention
 * (e.g. emission_obligation.scheme_id, not emission_scheme_id) rather than
 * verified live (DB access was down when this was written) — if Hibernate's
 * schema validation on boot flags a mismatch here, fix the @Column name(s)
 * it names exactly, the same way Period.java's created_by gap was found and
 * fixed earlier this session.
 */
@Entity
@Table(name = "regulatory_obligation")
@EntityListeners(AuditingEntityListener.class)
public class RegulatoryObligation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "obligation_id")
    private Integer obligationId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String legalEntityName;

    @NotNull
    @Column(name = "report_type_id", nullable = false)
    private Integer reportTypeId;

    @Transient
    @JsonProperty
    private String reportTypeName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "obligation_type", nullable = false, length = 20)
    private String obligationType;

    @Size(max = 500)
    @Column(name = "applicable_commodities", length = 500)
    private String applicableCommodities;

    @Column(name = "reporting_entity_id")
    private Integer reportingEntityId;

    @Transient
    @JsonProperty
    private String reportingEntityName;

    @Size(max = 100)
    @Column(name = "registration_ref", length = 100)
    private String registrationRef;

    @Column(name = "registered_date")
    private LocalDate registeredDate;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

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

    public Integer getObligationId() {
        return obligationId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public void setObligationId(Integer obligationId) {
        this.obligationId = obligationId;
    }

    public Integer getLegalEntityId() {
        return legalEntityId;
    }

    public void setLegalEntityId(Integer legalEntityId) {
        this.legalEntityId = legalEntityId;
    }

    public String getLegalEntityName() {
        return legalEntityName;
    }

    public void setLegalEntityName(String legalEntityName) {
        this.legalEntityName = legalEntityName;
    }

    public Integer getReportTypeId() {
        return reportTypeId;
    }

    public void setReportTypeId(Integer reportTypeId) {
        this.reportTypeId = reportTypeId;
    }

    public String getReportTypeName() {
        return reportTypeName;
    }

    public void setReportTypeName(String reportTypeName) {
        this.reportTypeName = reportTypeName;
    }

    public String getObligationType() {
        return obligationType;
    }

    public void setObligationType(String obligationType) {
        this.obligationType = obligationType;
    }

    public String getApplicableCommodities() {
        return applicableCommodities;
    }

    public void setApplicableCommodities(String applicableCommodities) {
        this.applicableCommodities = applicableCommodities;
    }

    public Integer getReportingEntityId() {
        return reportingEntityId;
    }

    public void setReportingEntityId(Integer reportingEntityId) {
        this.reportingEntityId = reportingEntityId;
    }

    public String getReportingEntityName() {
        return reportingEntityName;
    }

    public void setReportingEntityName(String reportingEntityName) {
        this.reportingEntityName = reportingEntityName;
    }

    public String getRegistrationRef() {
        return registrationRef;
    }

    public void setRegistrationRef(String registrationRef) {
        this.registrationRef = registrationRef;
    }

    public LocalDate getRegisteredDate() {
        return registeredDate;
    }

    public void setRegisteredDate(LocalDate registeredDate) {
        this.registeredDate = registeredDate;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
