package com.etrm.system.rbac;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "role_function")
@EntityListeners(AuditingEntityListener.class)
public class RoleFunction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_function_id")
    private Integer roleFunctionId;

    // V150 — row_version already existed in the DB (V135), added here as a
    // real JPA field for the first time.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private UserRole role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "function_id", nullable = false)
    private AppFunction function;

    @Column(name = "access_level", nullable = false, length = 10)
    private String accessLevel = "READ";   // READ | READ_WRITE

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

    public Integer getRoleFunctionId() { return roleFunctionId; }
    public void setRoleFunctionId(Integer roleFunctionId) { this.roleFunctionId = roleFunctionId; }
    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public AppFunction getFunction() { return function; }
    public void setFunction(AppFunction function) { this.function = function; }
    public String getAccessLevel() { return accessLevel; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
