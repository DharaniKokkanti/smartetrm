package com.etrm.system.storagefacility;

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
 * dbo.storage_facility has NO audit columns at all (no created_at/created_by
 * either) — the frontend's createdAt field has no backing column and is
 * left unmapped/unpopulated. regulatoryRef/injectionRate/withdrawalRate/
 * statusCode likewise have no backing columns — genuinely absent concepts,
 * not naming differences, so left unmapped per this session's standing rule
 * (documented here rather than schema-extended). countryCode is resolved
 * transitively through the Location this facility belongs to (location
 * .country_id -> country.country_code) since storage_facility itself has no
 * country_id. storageType is the frontend's historical name for the real
 * facility_type numeric FK id itself (not a resolved code string — the
 * frontend resolves the label client-side via useCustomConfigOptions).
 * operator is genuinely free text on this table (unlike vessel/truck/
 * pipeline/container/railcar, where the equivalent column is an FK) —
 * mapped directly to the frontend's operatorName.
 */
@Entity
@Table(name = "storage_facility")
public class StorageFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "facility_id")
    private Integer storageId;

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

    @Transient
    @JsonProperty
    private String countryCode;

    public Integer getStorageId() {
        return storageId;
    }

    public void setStorageId(Integer storageId) {
        this.storageId = storageId;
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

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }
}
