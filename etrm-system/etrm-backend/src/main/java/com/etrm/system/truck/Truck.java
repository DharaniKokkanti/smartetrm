package com.etrm.system.truck;

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
import java.time.LocalDateTime;

/**
 * dbo.truck has only created_at/created_by — does not extend AuditableEntity;
 * createdBy is set manually by TruckService.
 *
 * Frontend/DB field mapping notes (per this session's standing rule — small
 * gaps get a rename, structural mismatches get documented and left unmapped):
 *  - vehicleId -> truck_id, licensePlate -> registration_no, vehicleCode ->
 *    fleet_no (both are secondary-identifier concepts, just renamed).
 *  - The frontend's single capacity+capacityUomCode pair has NO analog — the
 *    real columns split into capacity_litres/capacity_mt with no UOM FK at
 *    all. Left unmapped; the two real columns are exposed under their real
 *    names instead.
 *  - adrCertExpiry -> adr_expiry, inspectionExpiryDate -> next_inspection_date
 *    (the forward-looking one); last_inspection_date is exposed as its own
 *    extra field (lastInspectionDate) with no frontend counterpart.
 *  - licenseExpiryDate has no real analog (registration_no is just an id
 *    string, not a licence with an expiry) — left unmapped.
 *  - gvwTonnes/statusCode/vehicleName/commodityType have no backing columns
 *    at all — left unmapped, per brief.
 *  - operatorName: the frontend Truck type has NO operatorId field at all
 *    (only operatorName, unlike Container/Railcar which carry both) — the
 *    real column operator_id is NOT NULL, so TruckService resolves
 *    operatorName -> operator_id via TransportOperatorRepository, the same
 *    bridging technique used for PipelinePoint's fromPointCode/toPointCode.
 */
@Entity
@Table(name = "truck")
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "truck_id")
    private Integer vehicleId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "registration_no", nullable = false, length = 30)
    private String licensePlate;

    @Size(max = 20)
    @Column(name = "fleet_no", length = 20)
    private String vehicleCode;

    @NotNull
    @Column(name = "operator_id", nullable = false)
    private Integer operatorId;

    @Transient
    @JsonProperty
    private String operatorName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "truck_type", nullable = false, length = 30)
    private String vehicleType;

    @Column(name = "capacity_litres", precision = 12, scale = 2)
    private BigDecimal capacityLitres;

    @Column(name = "capacity_mt", precision = 10, scale = 3)
    private BigDecimal capacityMt;

    // TINYINT -> Short.
    @Column(name = "num_compartments")
    private Short numCompartments;

    @NotNull
    @Column(name = "adr_certified", nullable = false)
    private Boolean adrCertified = false;

    @Size(max = 100)
    @Column(name = "adr_classes", length = 100)
    private String adrClasses;

    @Column(name = "adr_expiry")
    private LocalDate adrCertExpiry;

    @Column(name = "last_inspection_date")
    private LocalDate lastInspectionDate;

    @Column(name = "next_inspection_date")
    private LocalDate inspectionExpiryDate;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @NotNull
    @Column(name = "country_id", nullable = false)
    private Integer countryId;

    @Transient
    @JsonProperty
    private String countryCode;

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getVehicleCode() {
        return vehicleCode;
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public Integer getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Integer operatorId) {
        this.operatorId = operatorId;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public BigDecimal getCapacityLitres() {
        return capacityLitres;
    }

    public void setCapacityLitres(BigDecimal capacityLitres) {
        this.capacityLitres = capacityLitres;
    }

    public BigDecimal getCapacityMt() {
        return capacityMt;
    }

    public void setCapacityMt(BigDecimal capacityMt) {
        this.capacityMt = capacityMt;
    }

    public Short getNumCompartments() {
        return numCompartments;
    }

    public void setNumCompartments(Short numCompartments) {
        this.numCompartments = numCompartments;
    }

    public Boolean getAdrCertified() {
        return adrCertified;
    }

    public void setAdrCertified(Boolean adrCertified) {
        this.adrCertified = adrCertified;
    }

    public String getAdrClasses() {
        return adrClasses;
    }

    public void setAdrClasses(String adrClasses) {
        this.adrClasses = adrClasses;
    }

    public LocalDate getAdrCertExpiry() {
        return adrCertExpiry;
    }

    public void setAdrCertExpiry(LocalDate adrCertExpiry) {
        this.adrCertExpiry = adrCertExpiry;
    }

    public LocalDate getLastInspectionDate() {
        return lastInspectionDate;
    }

    public void setLastInspectionDate(LocalDate lastInspectionDate) {
        this.lastInspectionDate = lastInspectionDate;
    }

    public LocalDate getInspectionExpiryDate() {
        return inspectionExpiryDate;
    }

    public void setInspectionExpiryDate(LocalDate inspectionExpiryDate) {
        this.inspectionExpiryDate = inspectionExpiryDate;
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

    public Integer getCountryId() {
        return countryId;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }
}
