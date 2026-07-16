package com.etrm.system.sof;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.sof_event_type is served generically via the Tier2 reference-data
 * mechanism (no dedicated controller) — minimal read-only reader so
 * VoyageSofEventService can resolve sof_event_type_id -> its code/name for
 * display.
 */
@Entity
@Table(name = "sof_event_type")
public class SofEventType {

    @Id
    @Column(name = "sof_event_type_id")
    private Integer sofEventTypeId;

    @Column(name = "event_code", nullable = false, length = 30)
    private String eventCode;

    @Column(name = "event_name", nullable = false, length = 150)
    private String eventName;

    public Integer getSofEventTypeId() {
        return sofEventTypeId;
    }

    public String getEventCode() {
        return eventCode;
    }

    public String getEventName() {
        return eventName;
    }
}
