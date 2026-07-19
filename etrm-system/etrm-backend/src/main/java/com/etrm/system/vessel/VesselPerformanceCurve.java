package com.etrm.system.vessel;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vessel_performance_curve")
public class VesselPerformanceCurve extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "curve_id")
    private Integer curveId;

    // V132 — optimistic locking (Batch E, voyage-ops/maritime). See V127/LegalEntity for the pattern.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "vessel_id", nullable = false)
    private Integer vesselId;

    @Transient
    @JsonProperty
    private String vesselName;

    @NotBlank
    @Column(name = "condition", nullable = false, length = 10)
    private String condition;

    @NotNull
    @Column(name = "speed_knots", nullable = false, precision = 5, scale = 2)
    private BigDecimal speedKnots;

    @NotNull
    @Column(name = "main_engine_consumption_mt_per_day", nullable = false, precision = 8, scale = 3)
    private BigDecimal mainEngineConsumptionMtPerDay;

    @Column(name = "aux_engine_consumption_mt_per_day", precision = 8, scale = 3)
    private BigDecimal auxEngineConsumptionMtPerDay;

    @Column(name = "fuel_grade_id")
    private Integer fuelGradeId;

    @Transient
    @JsonProperty
    private String fuelGradeCode;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getCurveId() {
        return curveId;
    }

    public void setCurveId(Integer curveId) {
        this.curveId = curveId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public BigDecimal getSpeedKnots() {
        return speedKnots;
    }

    public void setSpeedKnots(BigDecimal speedKnots) {
        this.speedKnots = speedKnots;
    }

    public BigDecimal getMainEngineConsumptionMtPerDay() {
        return mainEngineConsumptionMtPerDay;
    }

    public void setMainEngineConsumptionMtPerDay(BigDecimal mainEngineConsumptionMtPerDay) {
        this.mainEngineConsumptionMtPerDay = mainEngineConsumptionMtPerDay;
    }

    public BigDecimal getAuxEngineConsumptionMtPerDay() {
        return auxEngineConsumptionMtPerDay;
    }

    public void setAuxEngineConsumptionMtPerDay(BigDecimal auxEngineConsumptionMtPerDay) {
        this.auxEngineConsumptionMtPerDay = auxEngineConsumptionMtPerDay;
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

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
