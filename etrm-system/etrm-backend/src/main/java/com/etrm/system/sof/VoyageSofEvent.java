package com.etrm.system.sof;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "voyage_sof_event")
public class VoyageSofEvent extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sof_event_id")
    private Integer sofEventId;

    @NotNull
    @Column(name = "voyage_id", nullable = false)
    private Integer voyageId;

    @NotNull
    @Column(name = "port_location_id", nullable = false)
    private Integer portLocationId;

    @Transient
    @JsonProperty
    private String portLocationName;

    @NotNull
    @Column(name = "port_call_sequence", nullable = false)
    private Short portCallSequence = 1;

    @NotNull
    @Column(name = "sof_event_type_id", nullable = false)
    private Integer sofEventTypeId;

    @Transient
    @JsonProperty
    private String eventCode;

    @NotNull
    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime eventTimestamp;

    @Size(max = 500)
    @Column(name = "remarks", length = 500)
    private String remarks;

    @NotNull
    @Column(name = "is_manual_entry", nullable = false)
    private Boolean isManualEntry = true;

    public Integer getSofEventId() {
        return sofEventId;
    }

    public void setSofEventId(Integer sofEventId) {
        this.sofEventId = sofEventId;
    }

    public Integer getVoyageId() {
        return voyageId;
    }

    public void setVoyageId(Integer voyageId) {
        this.voyageId = voyageId;
    }

    public Integer getPortLocationId() {
        return portLocationId;
    }

    public void setPortLocationId(Integer portLocationId) {
        this.portLocationId = portLocationId;
    }

    public String getPortLocationName() {
        return portLocationName;
    }

    public void setPortLocationName(String portLocationName) {
        this.portLocationName = portLocationName;
    }

    public Short getPortCallSequence() {
        return portCallSequence;
    }

    public void setPortCallSequence(Short portCallSequence) {
        this.portCallSequence = portCallSequence;
    }

    public Integer getSofEventTypeId() {
        return sofEventTypeId;
    }

    public void setSofEventTypeId(Integer sofEventTypeId) {
        this.sofEventTypeId = sofEventTypeId;
    }

    public String getEventCode() {
        return eventCode;
    }

    public void setEventCode(String eventCode) {
        this.eventCode = eventCode;
    }

    public LocalDateTime getEventTimestamp() {
        return eventTimestamp;
    }

    public void setEventTimestamp(LocalDateTime eventTimestamp) {
        this.eventTimestamp = eventTimestamp;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Boolean getIsManualEntry() {
        return isManualEntry;
    }

    public void setIsManualEntry(Boolean isManualEntry) {
        this.isManualEntry = isManualEntry;
    }
}
