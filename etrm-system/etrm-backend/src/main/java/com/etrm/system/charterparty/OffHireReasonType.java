package com.etrm.system.charterparty;

import com.etrm.system.common.SourceSystemDefaults;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    private void onCreate() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    private void onUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getOffHireReasonTypeId() {
        return offHireReasonTypeId;
    }

    public String getReasonCode() {
        return reasonCode;
    }

    public String getReasonName() {
        return reasonName;
    }

    public Short getCreatedSrcId() {
        return createdSrcId;
    }

    public void setCreatedSrcId(Short createdSrcId) {
        this.createdSrcId = createdSrcId;
    }

    public Short getUpdatedSrcId() {
        return updatedSrcId;
    }
}
