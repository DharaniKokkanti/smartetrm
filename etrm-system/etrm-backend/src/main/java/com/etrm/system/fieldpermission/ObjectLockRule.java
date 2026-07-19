package com.etrm.system.fieldpermission;

import jakarta.persistence.*;

@Entity
@Table(name = "object_lock_rule")
public class ObjectLockRule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lock_rule_id")
    private Integer lockRuleId;

    // V129 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "screen_code", nullable = false, length = 100)
    private String screenCode;

    /** '*' means all fields on this screen. */
    @Column(name = "field_key", nullable = false, length = 200)
    private String fieldKey;

    /** TRADE_STATUS | HAS_INVOICE | HAS_COST | HAS_SHIPMENT | TRADE_TYPE */
    @Column(name = "condition_type", nullable = false, length = 50)
    private String conditionType;

    /** Comma-separated trigger values e.g. "CONFIRMED,MATURED,CLOSED" or "true" */
    @Column(name = "condition_values", nullable = false, length = 500)
    private String conditionValues;

    /** VIEW | HIDDEN — the permission the field is locked to when condition matches */
    @Column(name = "locked_to", nullable = false, length = 10)
    private String lockedTo;

    @Column(name = "lock_reason", length = 500)
    private String lockReason;

    @Column(name = "sort_order", nullable = false)
    private Short sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getLockRuleId() { return lockRuleId; }
    public void setLockRuleId(Integer lockRuleId) { this.lockRuleId = lockRuleId; }
    public Integer getRowVersion() { return rowVersion; }
    public void setRowVersion(Integer rowVersion) { this.rowVersion = rowVersion; }
    public String getScreenCode() { return screenCode; }
    public void setScreenCode(String screenCode) { this.screenCode = screenCode; }
    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }
    public String getConditionType() { return conditionType; }
    public void setConditionType(String conditionType) { this.conditionType = conditionType; }
    public String getConditionValues() { return conditionValues; }
    public void setConditionValues(String conditionValues) { this.conditionValues = conditionValues; }
    public String getLockedTo() { return lockedTo; }
    public void setLockedTo(String lockedTo) { this.lockedTo = lockedTo; }
    public String getLockReason() { return lockReason; }
    public void setLockReason(String lockReason) { this.lockReason = lockReason; }
    public Short getSortOrder() { return sortOrder; }
    public void setSortOrder(Short sortOrder) { this.sortOrder = sortOrder; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
