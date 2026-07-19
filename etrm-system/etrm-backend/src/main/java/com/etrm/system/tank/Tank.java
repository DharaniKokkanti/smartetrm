package com.etrm.system.tank;

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

@Entity
@Table(name = "tank")
public class Tank extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tank_id")
    private Integer tankId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "facility_id", nullable = false)
    private Integer facilityId;

    @Transient
    @JsonProperty
    private String facilityName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "tank_number", nullable = false, length = 30)
    private String tankNumber;

    @Size(max = 200)
    @Column(name = "tank_name", length = 200)
    private String tankName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "tank_type", nullable = false, length = 30)
    private String tankType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "commodity_type", nullable = false, length = 20)
    private String commodityType;

    @Column(name = "primary_product_id")
    private Integer primaryProductId;

    @Transient
    @JsonProperty
    private String primaryProductName;

    @Column(name = "nominal_capacity_m3", precision = 12, scale = 3)
    private BigDecimal nominalCapacityM3;

    @Column(name = "working_capacity_m3", precision = 12, scale = 3)
    private BigDecimal workingCapacityM3;

    @Column(name = "heel_volume_m3", precision = 10, scale = 3)
    private BigDecimal heelVolumeM3;

    @Column(name = "diameter_m", precision = 8, scale = 2)
    private BigDecimal diameterM;

    @Column(name = "height_m", precision = 8, scale = 2)
    private BigDecimal heightM;

    @NotNull
    @Column(name = "is_heated", nullable = false)
    private Boolean isHeated = false;

    @Column(name = "max_temp_celsius", precision = 5, scale = 1)
    private BigDecimal maxTempCelsius;

    @NotNull
    @Column(name = "has_metering", nullable = false)
    private Boolean hasMetering = false;

    @Size(max = 50)
    @Column(name = "meter_ref", length = 50)
    private String meterRef;

    @NotBlank
    @Size(max = 20)
    @Column(name = "tank_status", nullable = false, length = 20)
    private String tankStatus;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "heel_product_id")
    private Integer heelProductId;

    @Transient
    @JsonProperty
    private String heelProductName;

    @Column(name = "min_operating_level_m3", precision = 12, scale = 3)
    private BigDecimal minOperatingLevelM3;

    @Column(name = "max_safe_fill_level_m3", precision = 12, scale = 3)
    private BigDecimal maxSafeFillLevelM3;

    public Integer getTankId() {
        return tankId;
    }

    public void setTankId(Integer tankId) {
        this.tankId = tankId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public String getTankNumber() {
        return tankNumber;
    }

    public void setTankNumber(String tankNumber) {
        this.tankNumber = tankNumber;
    }

    public String getTankName() {
        return tankName;
    }

    public void setTankName(String tankName) {
        this.tankName = tankName;
    }

    public String getTankType() {
        return tankType;
    }

    public void setTankType(String tankType) {
        this.tankType = tankType;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public Integer getPrimaryProductId() {
        return primaryProductId;
    }

    public void setPrimaryProductId(Integer primaryProductId) {
        this.primaryProductId = primaryProductId;
    }

    public String getPrimaryProductName() {
        return primaryProductName;
    }

    public void setPrimaryProductName(String primaryProductName) {
        this.primaryProductName = primaryProductName;
    }

    public BigDecimal getNominalCapacityM3() {
        return nominalCapacityM3;
    }

    public void setNominalCapacityM3(BigDecimal nominalCapacityM3) {
        this.nominalCapacityM3 = nominalCapacityM3;
    }

    public BigDecimal getWorkingCapacityM3() {
        return workingCapacityM3;
    }

    public void setWorkingCapacityM3(BigDecimal workingCapacityM3) {
        this.workingCapacityM3 = workingCapacityM3;
    }

    public BigDecimal getHeelVolumeM3() {
        return heelVolumeM3;
    }

    public void setHeelVolumeM3(BigDecimal heelVolumeM3) {
        this.heelVolumeM3 = heelVolumeM3;
    }

    public BigDecimal getDiameterM() {
        return diameterM;
    }

    public void setDiameterM(BigDecimal diameterM) {
        this.diameterM = diameterM;
    }

    public BigDecimal getHeightM() {
        return heightM;
    }

    public void setHeightM(BigDecimal heightM) {
        this.heightM = heightM;
    }

    public Boolean getIsHeated() {
        return isHeated;
    }

    public void setIsHeated(Boolean isHeated) {
        this.isHeated = isHeated;
    }

    public BigDecimal getMaxTempCelsius() {
        return maxTempCelsius;
    }

    public void setMaxTempCelsius(BigDecimal maxTempCelsius) {
        this.maxTempCelsius = maxTempCelsius;
    }

    public Boolean getHasMetering() {
        return hasMetering;
    }

    public void setHasMetering(Boolean hasMetering) {
        this.hasMetering = hasMetering;
    }

    public String getMeterRef() {
        return meterRef;
    }

    public void setMeterRef(String meterRef) {
        this.meterRef = meterRef;
    }

    public String getTankStatus() {
        return tankStatus;
    }

    public void setTankStatus(String tankStatus) {
        this.tankStatus = tankStatus;
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

    public Integer getHeelProductId() {
        return heelProductId;
    }

    public void setHeelProductId(Integer heelProductId) {
        this.heelProductId = heelProductId;
    }

    public String getHeelProductName() {
        return heelProductName;
    }

    public void setHeelProductName(String heelProductName) {
        this.heelProductName = heelProductName;
    }

    public BigDecimal getMinOperatingLevelM3() {
        return minOperatingLevelM3;
    }

    public void setMinOperatingLevelM3(BigDecimal minOperatingLevelM3) {
        this.minOperatingLevelM3 = minOperatingLevelM3;
    }

    public BigDecimal getMaxSafeFillLevelM3() {
        return maxSafeFillLevelM3;
    }

    public void setMaxSafeFillLevelM3(BigDecimal maxSafeFillLevelM3) {
        this.maxSafeFillLevelM3 = maxSafeFillLevelM3;
    }
}
