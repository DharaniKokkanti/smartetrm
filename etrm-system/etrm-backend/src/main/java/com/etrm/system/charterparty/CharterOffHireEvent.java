package com.etrm.system.charterparty;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "charter_off_hire_event")
public class CharterOffHireEvent extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "off_hire_event_id")
    private Integer offHireEventId;

    // V132 — optimistic locking (Batch E, voyage-ops/maritime). See V127/LegalEntity for the pattern.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "charter_party_id", nullable = false)
    private Integer charterPartyId;

    @NotNull
    @Column(name = "off_hire_reason_type_id", nullable = false)
    private Integer offHireReasonTypeId;

    @Transient
    @JsonProperty
    private String reasonCode;

    @NotNull
    @Column(name = "from_ts", nullable = false)
    private LocalDateTime fromTs;

    @Column(name = "to_ts")
    private LocalDateTime toTs;

    @Column(name = "hours", precision = 10, scale = 2)
    private BigDecimal hours;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getOffHireEventId() {
        return offHireEventId;
    }

    public void setOffHireEventId(Integer offHireEventId) {
        this.offHireEventId = offHireEventId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getCharterPartyId() {
        return charterPartyId;
    }

    public void setCharterPartyId(Integer charterPartyId) {
        this.charterPartyId = charterPartyId;
    }

    public Integer getOffHireReasonTypeId() {
        return offHireReasonTypeId;
    }

    public void setOffHireReasonTypeId(Integer offHireReasonTypeId) {
        this.offHireReasonTypeId = offHireReasonTypeId;
    }

    public String getReasonCode() {
        return reasonCode;
    }

    public void setReasonCode(String reasonCode) {
        this.reasonCode = reasonCode;
    }

    public LocalDateTime getFromTs() {
        return fromTs;
    }

    public void setFromTs(LocalDateTime fromTs) {
        this.fromTs = fromTs;
    }

    public LocalDateTime getToTs() {
        return toTs;
    }

    public void setToTs(LocalDateTime toTs) {
        this.toTs = toTs;
    }

    public BigDecimal getHours() {
        return hours;
    }

    public void setHours(BigDecimal hours) {
        this.hours = hours;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
