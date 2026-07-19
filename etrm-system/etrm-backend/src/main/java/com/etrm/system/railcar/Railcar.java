package com.etrm.system.railcar;

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

/**
 * dbo.railcar has only created_at/created_by — does not extend
 * AuditableEntity; createdBy is set manually by RailcarService. Note
 * build_year is INT here (unlike Vessel.buildYear which is SMALLINT).
 */
@Entity
@Table(name = "railcar")
public class Railcar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "railcar_id")
    private Integer railcarId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotBlank
    @Size(max = 30)
    @Column(name = "car_number", nullable = false, length = 30)
    private String carNumber;

    @NotBlank
    @Size(max = 30)
    @Column(name = "car_type", nullable = false, length = 30)
    private String carType;

    @NotNull
    @Column(name = "operator_id", nullable = false)
    private Integer operatorId;

    @Transient
    @JsonProperty
    private String operatorName;

    @Column(name = "capacity_litres", precision = 12, scale = 2)
    private BigDecimal capacityLitres;

    @Column(name = "capacity_mt", precision = 10, scale = 3)
    private BigDecimal capacityMt;

    @Size(max = 20)
    @Column(name = "dot_class", length = 20)
    private String dotClass;

    @Size(max = 20)
    @Column(name = "aar_class", length = 20)
    private String aarClass;

    @Column(name = "last_test_date")
    private LocalDate lastTestDate;

    @Column(name = "next_test_date")
    private LocalDate nextTestDate;

    @Column(name = "cert_expiry")
    private LocalDate certExpiry;

    @Size(max = 100)
    @Column(name = "home_railroad", length = 100)
    private String homeRailroad;

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

    @Column(name = "build_year")
    private Integer buildYear;

    @Column(name = "gross_rail_load_lbs", precision = 10, scale = 2)
    private BigDecimal grossRailLoadLbs;

    @NotNull
    @Column(name = "country_id", nullable = false)
    private Integer countryId;

    @Transient
    @JsonProperty
    private String countryName;

    public Integer getRailcarId() {
        return railcarId;
    }

    public void setRailcarId(Integer railcarId) {
        this.railcarId = railcarId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getCarNumber() {
        return carNumber;
    }

    public void setCarNumber(String carNumber) {
        this.carNumber = carNumber;
    }

    public String getCarType() {
        return carType;
    }

    public void setCarType(String carType) {
        this.carType = carType;
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

    public String getDotClass() {
        return dotClass;
    }

    public void setDotClass(String dotClass) {
        this.dotClass = dotClass;
    }

    public String getAarClass() {
        return aarClass;
    }

    public void setAarClass(String aarClass) {
        this.aarClass = aarClass;
    }

    public LocalDate getLastTestDate() {
        return lastTestDate;
    }

    public void setLastTestDate(LocalDate lastTestDate) {
        this.lastTestDate = lastTestDate;
    }

    public LocalDate getNextTestDate() {
        return nextTestDate;
    }

    public void setNextTestDate(LocalDate nextTestDate) {
        this.nextTestDate = nextTestDate;
    }

    public LocalDate getCertExpiry() {
        return certExpiry;
    }

    public void setCertExpiry(LocalDate certExpiry) {
        this.certExpiry = certExpiry;
    }

    public String getHomeRailroad() {
        return homeRailroad;
    }

    public void setHomeRailroad(String homeRailroad) {
        this.homeRailroad = homeRailroad;
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

    public Integer getBuildYear() {
        return buildYear;
    }

    public void setBuildYear(Integer buildYear) {
        this.buildYear = buildYear;
    }

    public BigDecimal getGrossRailLoadLbs() {
        return grossRailLoadLbs;
    }

    public void setGrossRailLoadLbs(BigDecimal grossRailLoadLbs) {
        this.grossRailLoadLbs = grossRailLoadLbs;
    }

    public Integer getCountryId() {
        return countryId;
    }

    public void setCountryId(Integer countryId) {
        this.countryId = countryId;
    }

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }
}
