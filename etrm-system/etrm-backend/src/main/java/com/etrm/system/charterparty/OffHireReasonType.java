package com.etrm.system.charterparty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.off_hire_reason_type is served generically via the Tier2
 * reference-data mechanism (no dedicated controller) — minimal read-only
 * reader so CharterOffHireEventService can resolve the reason's code/name
 * for display.
 */
@Entity
@Table(name = "off_hire_reason_type")
public class OffHireReasonType {

    @Id
    @Column(name = "off_hire_reason_type_id")
    private Integer offHireReasonTypeId;

    @Column(name = "reason_code", nullable = false, length = 30)
    private String reasonCode;

    @Column(name = "reason_name", nullable = false, length = 150)
    private String reasonName;

    public Integer getOffHireReasonTypeId() {
        return offHireReasonTypeId;
    }

    public String getReasonCode() {
        return reasonCode;
    }

    public String getReasonName() {
        return reasonName;
    }
}
