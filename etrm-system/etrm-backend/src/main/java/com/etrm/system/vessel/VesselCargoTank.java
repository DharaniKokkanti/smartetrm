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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Covers both liquid-bulk cargo tanks and dry-bulk cargo holds via
 * tank_type — commodity-agnostic, matches the platform's own "never
 * commodity-specific" requirement rather than two near-identical tables.
 */
@Entity
@Table(name = "vessel_cargo_tank")
public class VesselCargoTank extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tank_id")
    private Integer tankId;

    @NotNull
    @Column(name = "vessel_id", nullable = false)
    private Integer vesselId;

    @Transient
    @JsonProperty
    private String vesselName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "tank_code", nullable = false, length = 20)
    private String tankCode;

    @NotBlank
    @Column(name = "tank_type", nullable = false, length = 15)
    private String tankType;

    @NotNull
    @Column(name = "capacity_cbm", nullable = false, precision = 12, scale = 2)
    private BigDecimal capacityCbm;

    @Size(max = 30)
    @Column(name = "coating_type", length = 30)
    private String coatingType;

    @Size(max = 30)
    @Column(name = "segregation_group", length = 30)
    private String segregationGroup;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getTankId() {
        return tankId;
    }

    public void setTankId(Integer tankId) {
        this.tankId = tankId;
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

    public String getTankCode() {
        return tankCode;
    }

    public void setTankCode(String tankCode) {
        this.tankCode = tankCode;
    }

    public String getTankType() {
        return tankType;
    }

    public void setTankType(String tankType) {
        this.tankType = tankType;
    }

    public BigDecimal getCapacityCbm() {
        return capacityCbm;
    }

    public void setCapacityCbm(BigDecimal capacityCbm) {
        this.capacityCbm = capacityCbm;
    }

    public String getCoatingType() {
        return coatingType;
    }

    public void setCoatingType(String coatingType) {
        this.coatingType = coatingType;
    }

    public String getSegregationGroup() {
        return segregationGroup;
    }

    public void setSegregationGroup(String segregationGroup) {
        this.segregationGroup = segregationGroup;
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
