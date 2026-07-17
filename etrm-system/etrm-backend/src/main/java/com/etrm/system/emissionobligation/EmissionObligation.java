package com.etrm.system.emissionobligation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.emission_obligation — no deactivate endpoint (frontend api.ts only has
 * list/create/update). shortfall_units is DB-computed/persisted; never
 * accepted from the client, just round-tripped from whatever's already
 * persisted (matches the shape after a save/reload).
 */
@Entity
@Table(name = "emission_obligation")
public class EmissionObligation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "obligation_id")
    private Integer obligationId;

    @NotNull
    @Column(name = "legal_entity_id", nullable = false)
    private Integer legalEntityId;

    @Transient
    @JsonProperty
    private String entityName;

    @NotNull
    @Column(name = "scheme_id", nullable = false)
    private Integer schemeId;

    @Transient
    @JsonProperty
    private String schemeName;

    @NotNull
    @Column(name = "obligation_year", nullable = false)
    private Short obligationYear;

    @Column(name = "verified_emissions", precision = 18, scale = 2)
    private BigDecimal verifiedEmissions;

    @Column(name = "allowances_held", precision = 18, scale = 2)
    private BigDecimal allowancesHeld;

    /** SQL Server computed column (verified_emissions - allowances_held) — read-only. */
    @Column(name = "shortfall_units", precision = 19, scale = 2, insertable = false, updatable = false)
    private BigDecimal shortfallUnits;

    @Column(name = "surrender_deadline")
    private LocalDate surrenderDeadline;

    // No @NotNull — client only sends the denormalized status code (see
    // @JsonIgnore below); this raw FK id is populated by resolveForeignKeys()
    // AFTER Bean Validation runs, so @NotNull here would reject every real request.
    @Column(name = "status", nullable = false)
    private Integer status;

    @Transient
    private String statusCode;

    @Column(name = "notes", columnDefinition = "nvarchar(max)")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getObligationId() {
        return obligationId;
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

    public Integer getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(Integer schemeId) {
        this.schemeId = schemeId;
    }

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
    }

    public Short getObligationYear() {
        return obligationYear;
    }

    public void setObligationYear(Short obligationYear) {
        this.obligationYear = obligationYear;
    }

    public BigDecimal getVerifiedEmissions() {
        return verifiedEmissions;
    }

    public void setVerifiedEmissions(BigDecimal verifiedEmissions) {
        this.verifiedEmissions = verifiedEmissions;
    }

    public BigDecimal getAllowancesHeld() {
        return allowancesHeld;
    }

    public void setAllowancesHeld(BigDecimal allowancesHeld) {
        this.allowancesHeld = allowancesHeld;
    }

    public BigDecimal getShortfallUnits() {
        return shortfallUnits;
    }

    public void setShortfallUnits(BigDecimal shortfallUnits) {
        this.shortfallUnits = shortfallUnits;
    }

    public LocalDate getSurrenderDeadline() {
        return surrenderDeadline;
    }

    public void setSurrenderDeadline(LocalDate surrenderDeadline) {
        this.surrenderDeadline = surrenderDeadline;
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
}
