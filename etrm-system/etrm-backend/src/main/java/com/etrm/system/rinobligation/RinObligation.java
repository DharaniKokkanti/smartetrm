package com.etrm.system.rinobligation;

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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.rin_obligation — no deactivate endpoint (frontend api.ts only has
 * list/create/update). d_code is a natural-key FK to rin_fuel_category.d_code
 * (not an id join). status is an int FK into dbo.lookup_value, category
 * 'RIN_OBLIGATION_STATUS' — resolved via LookupResolutionService, not a
 * dedicated type table like the other Environmental tables.
 * shortfall_quantity is a SQL Server computed column
 * (required_quantity - retired_quantity) — read-only.
 */
@Entity
@Table(name = "rin_obligation")
@EntityListeners(AuditingEntityListener.class)
public class RinObligation {

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
    private String entityName;

    @NotNull
    @Column(name = "compliance_year", nullable = false)
    private Short complianceYear;

    // dbo.rin_fuel_category.d_code is NVARCHAR(5) — max_length is in bytes
    // for NVARCHAR, so the real char limit is 5, not 10.
    @NotBlank
    @Size(max = 5)
    @Column(name = "d_code", nullable = false, length = 5)
    private String dCode;

    @Transient
    @JsonProperty
    private String fuelName;

    @NotNull
    @Column(name = "required_quantity", nullable = false)
    private Integer requiredQuantity;

    @NotNull
    @Column(name = "retired_quantity", nullable = false)
    private Integer retiredQuantity;

    /** SQL Server computed column (required_quantity - retired_quantity) — read-only. */
    @Column(name = "shortfall_quantity", insertable = false, updatable = false)
    private Integer shortfallQuantity;

    @Column(name = "deadline")
    private LocalDate deadline;

    // No @NotNull — client only sends the denormalized status code (see
    // @JsonIgnore below); this raw FK id is populated by resolveForeignKeys()
    // AFTER Bean Validation runs, so @NotNull here would reject every real request.
    @Column(name = "status", nullable = false)
    private Integer status;

    @Transient
    private String statusCode;

    @Column(name = "notes", columnDefinition = "nvarchar(max)")
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

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public Short getComplianceYear() {
        return complianceYear;
    }

    public void setComplianceYear(Short complianceYear) {
        this.complianceYear = complianceYear;
    }

    @JsonProperty("dCode")
    public String getDCode() {
        return dCode;
    }

    @JsonProperty("dCode")
    public void setDCode(String dCode) {
        this.dCode = dCode;
    }

    public String getFuelName() {
        return fuelName;
    }

    public void setFuelName(String fuelName) {
        this.fuelName = fuelName;
    }

    public Integer getRequiredQuantity() {
        return requiredQuantity;
    }

    public void setRequiredQuantity(Integer requiredQuantity) {
        this.requiredQuantity = requiredQuantity;
    }

    public Integer getRetiredQuantity() {
        return retiredQuantity;
    }

    public void setRetiredQuantity(Integer retiredQuantity) {
        this.retiredQuantity = retiredQuantity;
    }

    public Integer getShortfallQuantity() {
        return shortfallQuantity;
    }

    public void setShortfallQuantity(Integer shortfallQuantity) {
        this.shortfallQuantity = shortfallQuantity;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    @JsonIgnore
    public Integer getStatus() {
        return status;
    }

    @JsonIgnore
    public void setStatus(Integer status) {
        this.status = status;
    }

    @JsonProperty("status")
    public String getStatusCode() {
        return statusCode;
    }

    @JsonProperty("status")
    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
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
