package com.etrm.system.rbac;

import jakarta.persistence.*;

@Entity
@Table(name = "app_function")
public class AppFunction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "function_id")
    private Long functionId;

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
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Long getFunctionId() { return functionId; }
    public void setFunctionId(Long functionId) { this.functionId = functionId; }
    public AppModule getModule() { return module; }
    public void setModule(AppModule module) { this.module = module; }
    public String getFunctionCode() { return functionCode; }
    public void setFunctionCode(String functionCode) { this.functionCode = functionCode; }
    public String getFunctionName() { return functionName; }
    public void setFunctionName(String functionName) { this.functionName = functionName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
