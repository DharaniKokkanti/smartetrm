package com.etrm.system.rbac;

import jakarta.persistence.*;

@Entity
@Table(name = "role_function")
public class RoleFunction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_function_id")
    private Integer roleFunctionId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private UserRole role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "function_id", nullable = false)
    private AppFunction function;

    @Column(name = "access_level", nullable = false, length = 10)
    private String accessLevel = "READ";   // READ | READ_WRITE

    public Integer getRoleFunctionId() { return roleFunctionId; }
    public void setRoleFunctionId(Integer roleFunctionId) { this.roleFunctionId = roleFunctionId; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public AppFunction getFunction() { return function; }
    public void setFunction(AppFunction function) { this.function = function; }
    public String getAccessLevel() { return accessLevel; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }
}
