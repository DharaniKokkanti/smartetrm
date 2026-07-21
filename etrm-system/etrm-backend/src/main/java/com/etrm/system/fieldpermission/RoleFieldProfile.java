package com.etrm.system.fieldpermission;

import com.etrm.system.rbac.UserRole;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "role_field_profile")
@EntityListeners(AuditingEntityListener.class)
public class RoleFieldProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mapping_id")
    private Integer mappingId;

    // V150 — row_version already existed in the DB (V135), added here as a
    // real JPA field for the first time.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private UserRole role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_id", nullable = false)
    private FieldPermissionProfile profile;

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

    public Integer getMappingId() { return mappingId; }
    public void setMappingId(Integer mappingId) { this.mappingId = mappingId; }
    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public FieldPermissionProfile getProfile() { return profile; }
    public void setProfile(FieldPermissionProfile profile) { this.profile = profile; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
