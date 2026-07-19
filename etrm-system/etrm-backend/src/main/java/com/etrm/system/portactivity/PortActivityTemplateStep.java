package com.etrm.system.portactivity;

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

@Entity
@Table(name = "port_activity_template_step")
public class PortActivityTemplateStep extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "step_id")
    private Integer stepId;

    // V132 — optimistic locking (Batch E, voyage-ops/maritime). See V127/LegalEntity for the pattern.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "template_id", nullable = false)
    private Integer templateId;

    @NotNull
    @Column(name = "sof_event_type_id", nullable = false)
    private Integer sofEventTypeId;

    @Transient
    @JsonProperty
    private String eventCode;

    @NotNull
    @Column(name = "step_sequence", nullable = false)
    private Short stepSequence;

    @Column(name = "typical_duration_hours", precision = 6, scale = 2)
    private BigDecimal typicalDurationHours;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getStepId() {
        return stepId;
    }

    public void setStepId(Integer stepId) {
        this.stepId = stepId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Integer templateId) {
        this.templateId = templateId;
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

    public Short getStepSequence() {
        return stepSequence;
    }

    public void setStepSequence(Short stepSequence) {
        this.stepSequence = stepSequence;
    }

    public BigDecimal getTypicalDurationHours() {
        return typicalDurationHours;
    }

    public void setTypicalDurationHours(BigDecimal typicalDurationHours) {
        this.typicalDurationHours = typicalDurationHours;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
