package com.etrm.system.rbac;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_function")
@EntityListeners(AuditingEntityListener.class)
public class AppFunction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "function_id")
    private Integer functionId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id", nullable = false)
    private AppModule module;

    @Column(name = "function_code", nullable = false, length = 100)
    private String functionCode;

    @Column(name = "function_name", nullable = false, length = 200)
    private String functionName;

    @Column(name = "description", length = 500)
    private String description;

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

    public Integer getFunctionId() { return functionId; }
    public void setFunctionId(Integer functionId) { this.functionId = functionId; }
    public AppModule getModule() { return module; }
    public void setModule(AppModule module) { this.module = module; }
    public String getFunctionCode() { return functionCode; }
    public void setFunctionCode(String functionCode) { this.functionCode = functionCode; }
    public String getFunctionName() { return functionName; }
    public void setFunctionName(String functionName) { this.functionName = functionName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
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
