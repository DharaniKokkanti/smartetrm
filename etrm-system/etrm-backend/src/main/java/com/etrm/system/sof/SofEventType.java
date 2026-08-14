package com.etrm.system.sof;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import com.etrm.system.common.SourceSystemDefaults;

/**
 * dbo.sof_event_type is served generically via the Tier2 reference-data
 * mechanism (no dedicated controller) — minimal read-only reader so
 * VoyageSofEventService can resolve sof_event_type_id -> its code/name for
 * display.
 */
@Entity
@Table(name = "ref_sof_event_type")
public class SofEventType {

    @Id
    @Column(name = "sof_event_type_id")
    private Integer sofEventTypeId;

    @Column(name = "event_code", nullable = false, length = 30)
    private String eventCode;

    @Column(name = "event_name", nullable = false, length = 150)
    private String eventName;

    @Column(name = "created_src_id", nullable = false, updatable = false)
    private Short createdSrcId;

    @Column(name = "updated_src_id", nullable = false)
    private Short updatedSrcId;

    @PrePersist
    protected void onPrePersist() {
        createdSrcId = SourceSystemDefaults.tier1ApplicationScreen();
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    @PreUpdate
    protected void onPreUpdate() {
        updatedSrcId = SourceSystemDefaults.tier1ApplicationScreen();
    }

    public Integer getSofEventTypeId() {
        return sofEventTypeId;
    }

    public String getEventCode() {
        return eventCode;
    }

    public String getEventName() {
        return eventName;
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
