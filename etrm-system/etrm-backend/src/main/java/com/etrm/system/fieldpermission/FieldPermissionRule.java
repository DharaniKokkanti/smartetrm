package com.etrm.system.fieldpermission;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// V146 — added created_at/created_by/updated_at/updated_by via JPA auditing
// (see LegalEntity.rowVersion doc comment for the row_version convention
// this table already followed); rules are always delete-then-recreate on
// update (see FieldPermissionController.updateProfileRules), so every save
// here is an insert — no fetch-then-copy-back needed for created_at/
// created_by like the row_version=fresh update() pattern elsewhere.
@Entity
@Table(name = "field_permission_rule")
@EntityListeners(AuditingEntityListener.class)
public class FieldPermissionRule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rule_id")
    private Integer ruleId;

    // V129 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private FieldPermissionProfile profile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_id", nullable = false)
    private ScreenFieldRegistry field;

    @Column(name = "field_permission", nullable = false, length = 10)
    private String fieldPermission = "EDIT";    // EDIT | VIEW | HIDDEN

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

    public Integer getRuleId() { return ruleId; }
    public void setRuleId(Integer ruleId) { this.ruleId = ruleId; }
    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }
    public FieldPermissionProfile getProfile() { return profile; }
    public void setProfile(FieldPermissionProfile profile) { this.profile = profile; }
    public ScreenFieldRegistry getField() { return field; }
    public void setField(ScreenFieldRegistry field) { this.field = field; }
    public String getFieldPermission() { return fieldPermission; }
    public void setFieldPermission(String fieldPermission) { this.fieldPermission = fieldPermission; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public AccessLevel getAccessLevel() {
        return AccessLevel.valueOf(fieldPermission);
    }
}
