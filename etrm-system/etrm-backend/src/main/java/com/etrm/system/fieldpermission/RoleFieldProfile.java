package com.etrm.system.fieldpermission;

import com.etrm.system.rbac.UserRole;
import jakarta.persistence.*;

@Entity
@Table(name = "role_field_profile")
public class RoleFieldProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mapping_id")
    private Integer mappingId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private UserRole role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_id", nullable = false)
    private FieldPermissionProfile profile;

    public Integer getMappingId() { return mappingId; }
    public void setMappingId(Integer mappingId) { this.mappingId = mappingId; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public FieldPermissionProfile getProfile() { return profile; }
    public void setProfile(FieldPermissionProfile profile) { this.profile = profile; }
}
