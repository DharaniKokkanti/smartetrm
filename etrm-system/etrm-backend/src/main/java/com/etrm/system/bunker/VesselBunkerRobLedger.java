package com.etrm.system.bunker;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event-sourced, insert-only ROB ledger (prompt §5: "each stem, consumption,
 * or transfer is an immutable ledger entry"). Only created_at/created_by —
 * no updated_* columns, no update/delete endpoint in the service layer.
 */
@Entity
@Table(name = "vessel_bunker_rob_ledger")
public class VesselBunkerRobLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rob_ledger_id")
    private Integer robLedgerId;

    @NotNull
    @Column(name = "vessel_id", nullable = false)
    private Integer vesselId;

    @Transient
    @JsonProperty
    private String vesselName;

    @NotNull
    @Column(name = "fuel_grade_id", nullable = false)
    private Integer fuelGradeId;

    @Transient
    @JsonProperty
    private String fuelGradeCode;

    @NotBlank
    @Column(name = "event_type", nullable = false, length = 15)
    private String eventType;

    @NotNull
    @Column(name = "event_time", nullable = false)
    private LocalDateTime eventTime;

    @NotNull
    @Column(name = "quantity_change_mt", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityChangeMt;

    @NotNull
    @Column(name = "rob_after_mt", nullable = false, precision = 14, scale = 3)
    private BigDecimal robAfterMt;

    @Column(name = "voyage_id")
    private Integer voyageId;

    @Column(name = "voyage_leg", length = 10)
    private String voyageLeg;

    @Column(name = "engine_type", length = 15)
    private String engineType;

    @Column(name = "source_bunker_stem_id")
    private Integer sourceBunkerStemId;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getRobLedgerId() {
        return robLedgerId;
    }

    public void setRobLedgerId(Integer robLedgerId) {
        this.robLedgerId = robLedgerId;
    }

    public Integer getVesselId() {
        return vesselId;
    }

    public void setVesselId(Integer vesselId) {
        this.vesselId = vesselId;
    }

    public String getVesselName() {
        return vesselName;
    }

    public void setVesselName(String vesselName) {
        this.vesselName = vesselName;
    }

    public Integer getFuelGradeId() {
        return fuelGradeId;
    }

    public void setFuelGradeId(Integer fuelGradeId) {
        this.fuelGradeId = fuelGradeId;
    }

    public String getFuelGradeCode() {
        return fuelGradeCode;
    }

    public void setFuelGradeCode(String fuelGradeCode) {
        this.fuelGradeCode = fuelGradeCode;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getEventTime() {
        return eventTime;
    }

    public void setEventTime(LocalDateTime eventTime) {
        this.eventTime = eventTime;
    }

    public BigDecimal getQuantityChangeMt() {
        return quantityChangeMt;
    }

    public void setQuantityChangeMt(BigDecimal quantityChangeMt) {
        this.quantityChangeMt = quantityChangeMt;
    }

    public BigDecimal getRobAfterMt() {
        return robAfterMt;
    }

    public void setRobAfterMt(BigDecimal robAfterMt) {
        this.robAfterMt = robAfterMt;
    }

    public Integer getVoyageId() {
        return voyageId;
    }

    public void setVoyageId(Integer voyageId) {
        this.voyageId = voyageId;
    }

    public String getVoyageLeg() {
        return voyageLeg;
    }

    public void setVoyageLeg(String voyageLeg) {
        this.voyageLeg = voyageLeg;
    }

    public String getEngineType() {
        return engineType;
    }

    public void setEngineType(String engineType) {
        this.engineType = engineType;
    }

    public Integer getSourceBunkerStemId() {
        return sourceBunkerStemId;
    }

    public void setSourceBunkerStemId(Integer sourceBunkerStemId) {
        this.sourceBunkerStemId = sourceBunkerStemId;
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
}
