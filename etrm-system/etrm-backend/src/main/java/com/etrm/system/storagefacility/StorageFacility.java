package com.etrm.system.storagefacility;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * V151 — added created_at/created_by/updated_at/updated_by; dbo
 * .storage_facility previously had NO audit columns at all. The frontend's
 * createdAt field now has a real backing column. regulatoryRef/statusCode
 * still have no backing columns — genuinely absent concepts, not naming
 * differences, so left unmapped per this session's standing rule
 * (documented here rather than schema-extended). countryCode is resolved
 * transitively through the Location this facility belongs to
 * (location.country_id -> country.country_code) since storage_facility
 * itself has no country_id. storageType is the frontend's historical name
 * for the real facility_type numeric FK id itself (not a resolved code
 * string — the frontend resolves the label client-side via
 * useCustomConfigOptions). operator is genuinely free text on this table
 * (unlike vessel/truck/pipeline/container/railcar, where the equivalent
 * column is an FK) — mapped directly to the frontend's operatorName.
 *
 * V161 — gas-storage physical attributes added (max_injection_rate_per_day/
 * max_withdrawal_rate_per_day/gas_volume_uom_id/working_gas_capacity/
 * cushion_gas_volume). The rate columns close the pre-existing frontend gap
 * noted above: the frontend's injectionRate/withdrawalRate fields have
 * existed since before V103 with no backing column at all — this maps them
 * to the new real columns instead of introducing new field names.
 */
@Entity
@Table(name = "storage_facility")
@EntityListeners(AuditingEntityListener.class)
public class StorageFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "facility_id")
    private Integer storageId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "location_id", nullable = false)
    private Integer locationId;

    @Transient
    @JsonProperty
    private String locationCode;

    @NotBlank
    @Size(max = 30)
    @Column(name = "facility_code", nullable = false, length = 30)
    private String storageCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "facility_name", nullable = false, length = 200)
    private String storageName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "commodity_type", nullable = false, length = 20)
    private String commodityType;

    @Column(name = "capacity", precision = 18, scale = 4)
    private BigDecimal capacity;

    @Column(name = "capacity_uom_id")
    private Integer capacityUomId;

    @Transient
    @JsonProperty
    private String capacityUomCode;

    @Size(max = 200)
    @Column(name = "operator", length = 200)
    private String operatorName;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @NotNull
    @Column(name = "facility_type", nullable = false)
    private Integer storageType;

    @Column(name = "working_gas_capacity", precision = 18, scale = 4)
    private BigDecimal workingGasCapacity;

    @Column(name = "cushion_gas_volume", precision = 18, scale = 4)
    private BigDecimal cushionGasVolume;

    @Column(name = "max_injection_rate_per_day", precision = 18, scale = 4)
    private BigDecimal injectionRate;

    @Column(name = "max_withdrawal_rate_per_day", precision = 18, scale = 4)
    private BigDecimal withdrawalRate;

    @Column(name = "gas_volume_uom_id")
    private Integer gasVolumeUomId;

    @Transient
    @JsonProperty
    private String gasVolumeUomCode;

    @Transient
    @JsonProperty
    private String countryCode;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    public Integer getStorageId() {
        return storageId;
    }

    public void setStorageId(Integer storageId) {
        this.storageId = storageId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getLocationId() {
        return locationId;
    }

    public void setLocationId(Integer locationId) {
        this.locationId = locationId;
    }

    public String getLocationCode() {
        return locationCode;
    }

    public void setLocationCode(String locationCode) {
        this.locationCode = locationCode;
    }

    public String getStorageCode() {
        return storageCode;
    }

    public void setStorageCode(String storageCode) {
        this.storageCode = storageCode;
    }

    public String getStorageName() {
        return storageName;
    }

    public void setStorageName(String storageName) {
        this.storageName = storageName;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public BigDecimal getCapacity() {
        return capacity;
    }

    public void setCapacity(BigDecimal capacity) {
        this.capacity = capacity;
    }

    public Integer getCapacityUomId() {
        return capacityUomId;
    }

    public void setCapacityUomId(Integer capacityUomId) {
        this.capacityUomId = capacityUomId;
    }

    public String getCapacityUomCode() {
        return capacityUomCode;
    }

    public void setCapacityUomCode(String capacityUomCode) {
        this.capacityUomCode = capacityUomCode;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
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

    public Integer getStorageType() {
        return storageType;
    }

    public void setStorageType(Integer storageType) {
        this.storageType = storageType;
    }

    public BigDecimal getWorkingGasCapacity() {
        return workingGasCapacity;
    }

    public void setWorkingGasCapacity(BigDecimal workingGasCapacity) {
        this.workingGasCapacity = workingGasCapacity;
    }

    public BigDecimal getCushionGasVolume() {
        return cushionGasVolume;
    }

    public void setCushionGasVolume(BigDecimal cushionGasVolume) {
        this.cushionGasVolume = cushionGasVolume;
    }

    public BigDecimal getInjectionRate() {
        return injectionRate;
    }

    public void setInjectionRate(BigDecimal injectionRate) {
        this.injectionRate = injectionRate;
    }

    public BigDecimal getWithdrawalRate() {
        return withdrawalRate;
    }

    public void setWithdrawalRate(BigDecimal withdrawalRate) {
        this.withdrawalRate = withdrawalRate;
    }

    public Integer getGasVolumeUomId() {
        return gasVolumeUomId;
    }

    public void setGasVolumeUomId(Integer gasVolumeUomId) {
        this.gasVolumeUomId = gasVolumeUomId;
    }

    public String getGasVolumeUomCode() {
        return gasVolumeUomCode;
    }

    public void setGasVolumeUomCode(String gasVolumeUomCode) {
        this.gasVolumeUomCode = gasVolumeUomCode;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
