package com.etrm.system.pipeline;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * dbo.pipeline_cycle has only created_at/created_by — does not extend
 * AuditableEntity; createdBy is set manually by PipelineCycleService.
 */
@Entity
@Table(name = "pipeline_cycle")
public class PipelineCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cycle_id")
    private Integer cycleId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "pipeline_id", nullable = false)
    private Integer pipelineId;

    @Transient
    @JsonProperty
    private String pipelineName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "cycle_type", nullable = false, length = 20)
    private String cycleType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "cycle_code", nullable = false, length = 20)
    private String cycleCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "cycle_name", nullable = false, length = 100)
    private String cycleName;

    @Column(name = "product_id")
    private Integer productId;

    @Transient
    @JsonProperty
    private String productName;

    @Column(name = "nomination_deadline")
    private LocalTime nominationDeadline;

    @Column(name = "confirmation_deadline")
    private LocalTime confirmationDeadline;

    @Column(name = "scheduling_deadline")
    private LocalTime schedulingDeadline;

    @Column(name = "effective_start")
    private LocalTime effectiveStart;

    @Column(name = "effective_end")
    private LocalTime effectiveEnd;

    @Column(name = "calendar_id")
    private Integer calendarId;

    @Transient
    @JsonProperty
    private String calendarName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "applies_to_days", nullable = false, length = 20)
    private String appliesToDays;

    @Column(name = "tolerance_pct", precision = 5, scale = 2)
    private BigDecimal tolerancePct;

    // TINYINT -> Short.
    @NotNull
    @Column(name = "cycle_priority", nullable = false)
    private Short cyclePriority;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    public Integer getCycleId() {
        return cycleId;
    }

    public void setCycleId(Integer cycleId) {
        this.cycleId = cycleId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getPipelineId() {
        return pipelineId;
    }

    public void setPipelineId(Integer pipelineId) {
        this.pipelineId = pipelineId;
    }

    public String getPipelineName() {
        return pipelineName;
    }

    public void setPipelineName(String pipelineName) {
        this.pipelineName = pipelineName;
    }

    public String getCycleType() {
        return cycleType;
    }

    public void setCycleType(String cycleType) {
        this.cycleType = cycleType;
    }

    public String getCycleCode() {
        return cycleCode;
    }

    public void setCycleCode(String cycleCode) {
        this.cycleCode = cycleCode;
    }

    public String getCycleName() {
        return cycleName;
    }

    public void setCycleName(String cycleName) {
        this.cycleName = cycleName;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public LocalTime getNominationDeadline() {
        return nominationDeadline;
    }

    public void setNominationDeadline(LocalTime nominationDeadline) {
        this.nominationDeadline = nominationDeadline;
    }

    public LocalTime getConfirmationDeadline() {
        return confirmationDeadline;
    }

    public void setConfirmationDeadline(LocalTime confirmationDeadline) {
        this.confirmationDeadline = confirmationDeadline;
    }

    public LocalTime getSchedulingDeadline() {
        return schedulingDeadline;
    }

    public void setSchedulingDeadline(LocalTime schedulingDeadline) {
        this.schedulingDeadline = schedulingDeadline;
    }

    public LocalTime getEffectiveStart() {
        return effectiveStart;
    }

    public void setEffectiveStart(LocalTime effectiveStart) {
        this.effectiveStart = effectiveStart;
    }

    public LocalTime getEffectiveEnd() {
        return effectiveEnd;
    }

    public void setEffectiveEnd(LocalTime effectiveEnd) {
        this.effectiveEnd = effectiveEnd;
    }

    public Integer getCalendarId() {
        return calendarId;
    }

    public void setCalendarId(Integer calendarId) {
        this.calendarId = calendarId;
    }

    public String getCalendarName() {
        return calendarName;
    }

    public void setCalendarName(String calendarName) {
        this.calendarName = calendarName;
    }

    public String getAppliesToDays() {
        return appliesToDays;
    }

    public void setAppliesToDays(String appliesToDays) {
        this.appliesToDays = appliesToDays;
    }

    public BigDecimal getTolerancePct() {
        return tolerancePct;
    }

    public void setTolerancePct(BigDecimal tolerancePct) {
        this.tolerancePct = tolerancePct;
    }

    public Short getCyclePriority() {
        return cyclePriority;
    }

    public void setCyclePriority(Short cyclePriority) {
        this.cyclePriority = cyclePriority;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }
}
