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
import java.time.LocalDate;

/**
 * sire_inspection_date/cdi_berth_status added by V103 (small, justified
 * frontend gap). The frontend's owner/operator are free-text fields with NO
 * backing columns — the real schema instead has owner_operator_id/
 * manager_operator_id FKs into dbo.transport_operator (a structurally
 * different design, not a naming difference) — per this session's standing
 * rule those are left unmapped/unexposed here rather than faked; the real
 * FK ids + denormalized names are exposed instead under their real names
 * (ownerOperatorId/ownerOperatorName/managerOperatorId/managerOperatorName).
 * The frontend's statusCode is mapped onto the real vetting_status column
 * (both are free-text varchar(20) NOT NULL "status" concepts with no other
 * consumer for vetting_status) — vettingExpiry maps 1:1 to vetting_expiry
 * as its own distinct field.
 */
@Entity
@Table(name = "vessel")
public class Vessel extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vessel_id")
    private Integer vesselId;

    @NotBlank
    @Size(max = 10)
    @Column(name = "imo_number", nullable = false, length = 10)
    private String imoNumber;

    @NotBlank
    @Size(max = 200)
    @Column(name = "vessel_name", nullable = false, length = 200)
    private String vesselName;

    @NotNull
    @Column(name = "vessel_type_id", nullable = false)
    private Integer vesselTypeId;

    @Transient
    @JsonProperty
    private String vesselTypeCode;

    @Size(max = 10)
    @Column(name = "call_sign", length = 10)
    private String callSign;

    @Size(max = 9)
    @Column(name = "mmsi", length = 9)
    private String mmsi;

    @Column(name = "owner_operator_id")
    private Integer ownerOperatorId;

    @Transient
    @JsonProperty
    private String ownerOperatorName;

    @Column(name = "manager_operator_id")
    private Integer managerOperatorId;

    @Transient
    @JsonProperty
    private String managerOperatorName;

    @Column(name = "charterer_cp_id")
    private Integer chartererCpId;

    @Column(name = "dwt", precision = 12, scale = 2)
    private BigDecimal dwt;

    @Column(name = "gross_tonnage", precision = 12, scale = 2)
    private BigDecimal grossTonnage;

    @Column(name = "net_tonnage", precision = 12, scale = 2)
    private BigDecimal netTonnage;

    @Column(name = "cargo_capacity_cbm", precision = 12, scale = 2)
    private BigDecimal cargoCapacityCbm;

    @Column(name = "cargo_capacity_mt", precision = 12, scale = 2)
    private BigDecimal cargoCapacityMt;

    // SMALLINT -> Short.
    @Column(name = "num_cargo_tanks")
    private Short numCargoTanks;

    @Column(name = "num_segregations")
    private Short numSegregations;

    @Column(name = "length_overall_m", precision = 8, scale = 2)
    private BigDecimal lengthOverallM;

    @Column(name = "beam_m", precision = 8, scale = 2)
    private BigDecimal beamM;

    @Column(name = "draft_max_m", precision = 6, scale = 2)
    private BigDecimal draftMaxM;

    @Size(max = 20)
    @Column(name = "ice_class", length = 20)
    private String iceClass;

    @Column(name = "build_year")
    private Short buildYear;

    @Size(max = 200)
    @Column(name = "shipyard", length = 200)
    private String shipyard;

    @Size(max = 50)
    @Column(name = "classification_society", length = 50)
    private String classificationSociety;

    @Size(max = 100)
    @Column(name = "class_notation", length = 100)
    private String classNotation;

    // Frontend's statusCode — see class doc comment.
    @NotBlank
    @Size(max = 20)
    @Column(name = "vetting_status", nullable = false, length = 20)
    private String statusCode;

    @Column(name = "vetting_expiry")
    private LocalDate vettingExpiry;

    @Column(name = "sire_inspection_date")
    private LocalDate sireInspectionDate;

    @Size(max = 30)
    @Column(name = "cdi_berth_status", length = 30)
    private String cdiBerthStatus;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "grain_capacity_cbm", precision = 12, scale = 2)
    private BigDecimal grainCapacityCbm;

    @Column(name = "bale_capacity_cbm", precision = 12, scale = 2)
    private BigDecimal baleCapacityCbm;

    @Column(name = "guaranteed_boil_off_rate_pct_per_day", precision = 5, scale = 3)
    private BigDecimal guaranteedBoilOffRatePctPerDay;

    @Column(name = "heel_capacity_cbm", precision = 10, scale = 2)
    private BigDecimal heelCapacityCbm;

    @NotNull
    @Column(name = "flag_country_id", nullable = false)
    private Integer flagCountryId;

    @Transient
    @JsonProperty
    private String flagCountryCode;

    @Column(name = "build_country_id")
    private Integer buildCountryId;

    @Transient
    @JsonProperty
    private String buildCountryCode;

    @Column(name = "fleet_id")
    private Integer fleetId;

    @Transient
    @JsonProperty
    private String fleetName;

    public Integer getVesselId() {
        return vesselId;
    }

    public void setVesselId(Integer vesselId) {
        this.vesselId = vesselId;
    }

    public String getImoNumber() {
        return imoNumber;
    }

    public void setImoNumber(String imoNumber) {
        this.imoNumber = imoNumber;
    }

    public String getVesselName() {
        return vesselName;
    }

    public void setVesselName(String vesselName) {
        this.vesselName = vesselName;
    }

    public Integer getVesselTypeId() {
        return vesselTypeId;
    }

    public void setVesselTypeId(Integer vesselTypeId) {
        this.vesselTypeId = vesselTypeId;
    }

    public String getVesselTypeCode() {
        return vesselTypeCode;
    }

    public void setVesselTypeCode(String vesselTypeCode) {
        this.vesselTypeCode = vesselTypeCode;
    }

    public String getCallSign() {
        return callSign;
    }

    public void setCallSign(String callSign) {
        this.callSign = callSign;
    }

    public String getMmsi() {
        return mmsi;
    }

    public void setMmsi(String mmsi) {
        this.mmsi = mmsi;
    }

    public Integer getOwnerOperatorId() {
        return ownerOperatorId;
    }

    public void setOwnerOperatorId(Integer ownerOperatorId) {
        this.ownerOperatorId = ownerOperatorId;
    }

    public String getOwnerOperatorName() {
        return ownerOperatorName;
    }

    public void setOwnerOperatorName(String ownerOperatorName) {
        this.ownerOperatorName = ownerOperatorName;
    }

    public Integer getManagerOperatorId() {
        return managerOperatorId;
    }

    public void setManagerOperatorId(Integer managerOperatorId) {
        this.managerOperatorId = managerOperatorId;
    }

    public String getManagerOperatorName() {
        return managerOperatorName;
    }

    public void setManagerOperatorName(String managerOperatorName) {
        this.managerOperatorName = managerOperatorName;
    }

    public Integer getChartererCpId() {
        return chartererCpId;
    }

    public void setChartererCpId(Integer chartererCpId) {
        this.chartererCpId = chartererCpId;
    }

    public BigDecimal getDwt() {
        return dwt;
    }

    public void setDwt(BigDecimal dwt) {
        this.dwt = dwt;
    }

    public BigDecimal getGrossTonnage() {
        return grossTonnage;
    }

    public void setGrossTonnage(BigDecimal grossTonnage) {
        this.grossTonnage = grossTonnage;
    }

    public BigDecimal getNetTonnage() {
        return netTonnage;
    }

    public void setNetTonnage(BigDecimal netTonnage) {
        this.netTonnage = netTonnage;
    }

    public BigDecimal getCargoCapacityCbm() {
        return cargoCapacityCbm;
    }

    public void setCargoCapacityCbm(BigDecimal cargoCapacityCbm) {
        this.cargoCapacityCbm = cargoCapacityCbm;
    }

    public BigDecimal getCargoCapacityMt() {
        return cargoCapacityMt;
    }

    public void setCargoCapacityMt(BigDecimal cargoCapacityMt) {
        this.cargoCapacityMt = cargoCapacityMt;
    }

    public Short getNumCargoTanks() {
        return numCargoTanks;
    }

    public void setNumCargoTanks(Short numCargoTanks) {
        this.numCargoTanks = numCargoTanks;
    }

    public Short getNumSegregations() {
        return numSegregations;
    }

    public void setNumSegregations(Short numSegregations) {
        this.numSegregations = numSegregations;
    }

    public BigDecimal getLengthOverallM() {
        return lengthOverallM;
    }

    public void setLengthOverallM(BigDecimal lengthOverallM) {
        this.lengthOverallM = lengthOverallM;
    }

    public BigDecimal getBeamM() {
        return beamM;
    }

    public void setBeamM(BigDecimal beamM) {
        this.beamM = beamM;
    }

    public BigDecimal getDraftMaxM() {
        return draftMaxM;
    }

    public void setDraftMaxM(BigDecimal draftMaxM) {
        this.draftMaxM = draftMaxM;
    }

    public String getIceClass() {
        return iceClass;
    }

    public void setIceClass(String iceClass) {
        this.iceClass = iceClass;
    }

    public Short getBuildYear() {
        return buildYear;
    }

    public void setBuildYear(Short buildYear) {
        this.buildYear = buildYear;
    }

    public String getShipyard() {
        return shipyard;
    }

    public void setShipyard(String shipyard) {
        this.shipyard = shipyard;
    }

    public String getClassificationSociety() {
        return classificationSociety;
    }

    public void setClassificationSociety(String classificationSociety) {
        this.classificationSociety = classificationSociety;
    }

    public String getClassNotation() {
        return classNotation;
    }

    public void setClassNotation(String classNotation) {
        this.classNotation = classNotation;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public LocalDate getVettingExpiry() {
        return vettingExpiry;
    }

    public void setVettingExpiry(LocalDate vettingExpiry) {
        this.vettingExpiry = vettingExpiry;
    }

    public LocalDate getSireInspectionDate() {
        return sireInspectionDate;
    }

    public void setSireInspectionDate(LocalDate sireInspectionDate) {
        this.sireInspectionDate = sireInspectionDate;
    }

    public String getCdiBerthStatus() {
        return cdiBerthStatus;
    }

    public void setCdiBerthStatus(String cdiBerthStatus) {
        this.cdiBerthStatus = cdiBerthStatus;
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

    public BigDecimal getGrainCapacityCbm() {
        return grainCapacityCbm;
    }

    public void setGrainCapacityCbm(BigDecimal grainCapacityCbm) {
        this.grainCapacityCbm = grainCapacityCbm;
    }

    public BigDecimal getBaleCapacityCbm() {
        return baleCapacityCbm;
    }

    public void setBaleCapacityCbm(BigDecimal baleCapacityCbm) {
        this.baleCapacityCbm = baleCapacityCbm;
    }

    public BigDecimal getGuaranteedBoilOffRatePctPerDay() {
        return guaranteedBoilOffRatePctPerDay;
    }

    public void setGuaranteedBoilOffRatePctPerDay(BigDecimal guaranteedBoilOffRatePctPerDay) {
        this.guaranteedBoilOffRatePctPerDay = guaranteedBoilOffRatePctPerDay;
    }

    public BigDecimal getHeelCapacityCbm() {
        return heelCapacityCbm;
    }

    public void setHeelCapacityCbm(BigDecimal heelCapacityCbm) {
        this.heelCapacityCbm = heelCapacityCbm;
    }

    public Integer getFlagCountryId() {
        return flagCountryId;
    }

    public void setFlagCountryId(Integer flagCountryId) {
        this.flagCountryId = flagCountryId;
    }

    public String getFlagCountryCode() {
        return flagCountryCode;
    }

    public void setFlagCountryCode(String flagCountryCode) {
        this.flagCountryCode = flagCountryCode;
    }

    public Integer getBuildCountryId() {
        return buildCountryId;
    }

    public void setBuildCountryId(Integer buildCountryId) {
        this.buildCountryId = buildCountryId;
    }

    public String getBuildCountryCode() {
        return buildCountryCode;
    }

    public void setBuildCountryCode(String buildCountryCode) {
        this.buildCountryCode = buildCountryCode;
    }

    public Integer getFleetId() {
        return fleetId;
    }

    public void setFleetId(Integer fleetId) {
        this.fleetId = fleetId;
    }

    public String getFleetName() {
        return fleetName;
    }

    public void setFleetName(String fleetName) {
        this.fleetName = fleetName;
    }
}
