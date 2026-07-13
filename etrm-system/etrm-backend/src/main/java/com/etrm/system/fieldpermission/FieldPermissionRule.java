package com.etrm.system.fieldpermission;

import jakarta.persistence.*;

@Entity
@Table(name = "field_permission_rule")
public class FieldPermissionRule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rule_id")
    private Integer ruleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private FieldPermissionProfile profile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_id", nullable = false)
    private ScreenFieldRegistry field;

    @Column(name = "field_permission", nullable = false, length = 10)
    private String fieldPermission = "EDIT";    // EDIT | VIEW | HIDDEN

    public Integer getRuleId() { return ruleId; }
    public void setRuleId(Integer ruleId) { this.ruleId = ruleId; }
    public FieldPermissionProfile getProfile() { return profile; }
    public void setProfile(FieldPermissionProfile profile) { this.profile = profile; }
    public ScreenFieldRegistry getField() { return field; }
    public void setField(ScreenFieldRegistry field) { this.field = field; }
    public String getFieldPermission() { return fieldPermission; }
    public void setFieldPermission(String fieldPermission) { this.fieldPermission = fieldPermission; }

    public AccessLevel getAccessLevel() {
        return AccessLevel.valueOf(fieldPermission);
    }
}
