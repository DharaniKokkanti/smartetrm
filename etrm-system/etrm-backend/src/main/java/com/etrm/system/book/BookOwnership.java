package com.etrm.system.book;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.book_ownership (V126) — book-level economic ownership, independent of
 * the book's parent legal_entity's own entity_type/ownership. A wholly
 * normal, single-owner TRADING_COMPANY-typed legal entity can still have
 * one specific book split with an external partner (the real-world
 * Musket/Circle K-style case that prompted this) while every other book
 * under that entity stays 100% the entity's own. Same shape as
 * LegalEntityOwnership — owner is one of three cases (ownerType):
 * LEGAL_ENTITY/COUNTERPARTY resolve via ownerRefId, EXTERNAL uses the
 * free-text externalOwnerName fallback.
 *
 * V144 — created_at/created_by upgraded to real @CreatedDate/@CreatedBy
 * JPA-auditing fields (were plain @Column + @PrePersist), and
 * updated_at/updated_by added, matching GlAccount's shape. effectiveFrom's
 * own @PrePersist default is kept as-is (not an audit column).
 */
@Entity
@Table(name = "book_ownership")
@EntityListeners(AuditingEntityListener.class)
public class BookOwnership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_ownership_id")
    private Integer bookOwnershipId;

    // V129 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "book_id", nullable = false)
    private Integer bookId;

    @NotBlank
    @Column(name = "owner_type", nullable = false, length = 20)
    private String ownerType;

    @Column(name = "owner_ref_id")
    private Integer ownerRefId;

    @Size(max = 200)
    @Column(name = "external_owner_name", length = 200)
    private String externalOwnerName;

    @Transient
    @JsonProperty
    private String ownerDisplayName;

    @NotNull
    @Column(name = "ownership_pct", nullable = false, precision = 6, scale = 3)
    private BigDecimal ownershipPct;

    @NotNull
    @Column(name = "is_operator", nullable = false)
    private Boolean isOperator = false;

    @NotBlank
    @Column(name = "consolidation_method", nullable = false, length = 20)
    private String consolidationMethod = "EQUITY";

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

    @PrePersist
    void onCreate() {
        if (effectiveFrom == null) effectiveFrom = LocalDate.now();
    }

    public Integer getBookOwnershipId() {
        return bookOwnershipId;
    }

    public void setBookOwnershipId(Integer bookOwnershipId) {
        this.bookOwnershipId = bookOwnershipId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
    }

    public Integer getOwnerRefId() {
        return ownerRefId;
    }

    public void setOwnerRefId(Integer ownerRefId) {
        this.ownerRefId = ownerRefId;
    }

    public String getExternalOwnerName() {
        return externalOwnerName;
    }

    public void setExternalOwnerName(String externalOwnerName) {
        this.externalOwnerName = externalOwnerName;
    }

    public String getOwnerDisplayName() {
        return ownerDisplayName;
    }

    public void setOwnerDisplayName(String ownerDisplayName) {
        this.ownerDisplayName = ownerDisplayName;
    }

    public BigDecimal getOwnershipPct() {
        return ownershipPct;
    }

    public void setOwnershipPct(BigDecimal ownershipPct) {
        this.ownershipPct = ownershipPct;
    }

    public Boolean getIsOperator() {
        return isOperator;
    }

    public void setIsOperator(Boolean isOperator) {
        this.isOperator = isOperator;
    }

    public String getConsolidationMethod() {
        return consolidationMethod;
    }

    public void setConsolidationMethod(String consolidationMethod) {
        this.consolidationMethod = consolidationMethod;
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
