package com.etrm.system.storagefacility;

import com.etrm.system.lookup.TypeCodeLookup;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Read path only, used to resolve StorageFacility.facilityType ->
 * facilityTypeCode. Unlike most TypeCodeLookup subclasses this table DOES
 * have full audit columns (created_at/created_by/updated_at/updated_by) —
 * but Java has no multiple inheritance, so those are mapped directly here
 * rather than via AuditableEntity (this entity is read-only regardless; no
 * controller built in this batch, per brief — already editable via the
 * generic Tier 2 mechanism).
 */
@Entity
@Table(name = "storage_facility_type")
public class StorageFacilityType extends TypeCodeLookup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "storage_facility_type_id")
    private Integer storageFacilityTypeId;

    @Column(name = "description", length = 500)
    private String description;

    // SMALLINT -> Short.
    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    public Integer getStorageFacilityTypeId() {
        return storageFacilityTypeId;
    }

    public void setStorageFacilityTypeId(Integer storageFacilityTypeId) {
        this.storageFacilityTypeId = storageFacilityTypeId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Short getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Short sortOrder) {
        this.sortOrder = sortOrder;
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
