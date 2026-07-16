package com.etrm.system.voyage;

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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "voyage")
public class Voyage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "voyage_id")
    private Integer voyageId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "voyage_number", nullable = false, length = 30)
    private String voyageNumber;

    @NotNull
    @Column(name = "vessel_id", nullable = false)
    private Integer vesselId;

    @Transient
    @JsonProperty
    private String vesselName;

    @Column(name = "charter_party_id")
    private Integer charterPartyId;

    @Transient
    @JsonProperty
    private String cpReference;

    @NotBlank
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PLANNED";

    @Column(name = "laden_ballast_status", length = 10)
    private String ladenBallastStatus;

    @Column(name = "laycan_start")
    private LocalDate laycanStart;

    @Column(name = "laycan_end")
    private LocalDate laycanEnd;

    @Column(name = "load_location_id")
    private Integer loadLocationId;

    @Transient
    @JsonProperty
    private String loadLocationName;

    @Column(name = "discharge_location_id")
    private Integer dischargeLocationId;

    @Transient
    @JsonProperty
    private String dischargeLocationName;

    @Column(name = "eta")
    private LocalDateTime eta;

    @Column(name = "etd")
    private LocalDateTime etd;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getVoyageId() {
        return voyageId;
    }

    public void setVoyageId(Integer voyageId) {
        this.voyageId = voyageId;
    }

    public String getVoyageNumber() {
        return voyageNumber;
    }

    public void setVoyageNumber(String voyageNumber) {
        this.voyageNumber = voyageNumber;
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

    public Integer getCharterPartyId() {
        return charterPartyId;
    }

    public void setCharterPartyId(Integer charterPartyId) {
        this.charterPartyId = charterPartyId;
    }

    public String getCpReference() {
        return cpReference;
    }

    public void setCpReference(String cpReference) {
        this.cpReference = cpReference;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLadenBallastStatus() {
        return ladenBallastStatus;
    }

    public void setLadenBallastStatus(String ladenBallastStatus) {
        this.ladenBallastStatus = ladenBallastStatus;
    }

    public LocalDate getLaycanStart() {
        return laycanStart;
    }

    public void setLaycanStart(LocalDate laycanStart) {
        this.laycanStart = laycanStart;
    }

    public LocalDate getLaycanEnd() {
        return laycanEnd;
    }

    public void setLaycanEnd(LocalDate laycanEnd) {
        this.laycanEnd = laycanEnd;
    }

    public Integer getLoadLocationId() {
        return loadLocationId;
    }

    public void setLoadLocationId(Integer loadLocationId) {
        this.loadLocationId = loadLocationId;
    }

    public String getLoadLocationName() {
        return loadLocationName;
    }

    public void setLoadLocationName(String loadLocationName) {
        this.loadLocationName = loadLocationName;
    }

    public Integer getDischargeLocationId() {
        return dischargeLocationId;
    }

    public void setDischargeLocationId(Integer dischargeLocationId) {
        this.dischargeLocationId = dischargeLocationId;
    }

    public String getDischargeLocationName() {
        return dischargeLocationName;
    }

    public void setDischargeLocationName(String dischargeLocationName) {
        this.dischargeLocationName = dischargeLocationName;
    }

    public LocalDateTime getEta() {
        return eta;
    }

    public void setEta(LocalDateTime eta) {
        this.eta = eta;
    }

    public LocalDateTime getEtd() {
        return etd;
    }

    public void setEtd(LocalDateTime etd) {
        this.etd = etd;
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
