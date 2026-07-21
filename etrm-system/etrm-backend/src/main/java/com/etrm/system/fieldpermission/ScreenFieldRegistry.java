package com.etrm.system.fieldpermission;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "screen_field_registry")
@EntityListeners(AuditingEntityListener.class)
public class ScreenFieldRegistry {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "field_id")
    private Integer fieldId;

    // V150 — row_version already existed in the DB (V135), added here as a
    // real JPA field for the first time.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "screen_code", nullable = false, length = 100)
    private String screenCode;

    @Column(name = "field_key", nullable = false, length = 200)
    private String fieldKey;

    @Column(name = "field_label", nullable = false, length = 200)
    private String fieldLabel;

    @Column(name = "field_group", length = 100)
    private String fieldGroup;

    @Column(name = "is_required_field", nullable = false)
    private Boolean isRequiredField = false;

    @Column(name = "sort_order", nullable = false)
    private Short sortOrder = 0;

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

    public Integer getFieldId() { return fieldId; }
    public void setFieldId(Integer fieldId) { this.fieldId = fieldId; }
    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }
    public String getScreenCode() { return screenCode; }
    public void setScreenCode(String screenCode) { this.screenCode = screenCode; }
    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }
    public String getFieldLabel() { return fieldLabel; }
    public void setFieldLabel(String fieldLabel) { this.fieldLabel = fieldLabel; }
    public String getFieldGroup() { return fieldGroup; }
    public void setFieldGroup(String fieldGroup) { this.fieldGroup = fieldGroup; }
    public Boolean getIsRequiredField() { return isRequiredField; }
    public void setIsRequiredField(Boolean isRequiredField) { this.isRequiredField = isRequiredField; }
    public Short getSortOrder() { return sortOrder; }
    public void setSortOrder(Short sortOrder) { this.sortOrder = sortOrder; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
