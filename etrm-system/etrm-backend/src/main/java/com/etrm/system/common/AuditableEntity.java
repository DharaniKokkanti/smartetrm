package com.etrm.system.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * created_at/created_by/updated_at/updated_by — present on every master
 * data table in the schema. Populated automatically via Spring Data JPA
 * auditing (see JpaAuditingConfig) rather than manually set in every
 * service method.
 *
 * createdSrcId/updatedSrcId (V194/V195) mirror them
 * exactly, but can't reuse Spring Data's @CreatedBy/@LastModifiedBy
 * mechanism (AuditorAware is typed to String, this is an int FK) — plain
 * JPA @PrePersist/@PreUpdate lifecycle callbacks on this shared superclass
 * instead, resolved via the static SourceSystemDefaults holder (see its
 * doc comment for why a static field, not constructor injection, here).
 * Fixes every one of the ~42 entities that extend this class in one place —
 * every other Tier1 entity (the ones with their own inline audit-column
 * declarations instead of extending this class, e.g. Broker.java) needs the
 * same two fields + two callback methods added individually.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

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

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    private void stampSourceSystemOnCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    private void stampSourceSystemOnUpdate() {
        // created* is set once and never changes, same as createdBy.
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
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

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
