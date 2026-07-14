package com.etrm.system.location;

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
 * dbo.location has only created_at/created_by (no updated columns) — does
 * not extend AuditableEntity; createdBy is set manually by LocationService.
 * port_code/unlocode added by V103 (small, justified frontend gap — see
 * that migration's comment). The frontend LocationTypeCode is a plain code
 * string, not the numeric location_type_id FK — LocationService resolves
 * locationTypeCode <-> locationTypeId via LocationTypeRepository, same
 * pattern as MarketService's commodityType resolution.
 */
@Entity
@Table(name = "location")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_id")
    private Integer locationId;

    @NotNull
    @Column(name = "location_type_id", nullable = false)
    private Integer locationTypeId;

    @Transient
    @JsonProperty
    private String locationTypeCode;

    @NotBlank
    @Size(max = 30)
    @Column(name = "location_code", nullable = false, length = 30)
    private String locationCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "location_name", nullable = false, length = 200)
    private String locationName;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @Size(max = 100)
    @Column(name = "region", length = 100)
    private String region;

    @Size(max = 50)
    @Column(name = "timezone", length = 50)
    private String timezone;

    @Column(name = "latitude", precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 9, scale = 6)
    private BigDecimal longitude;

    @Size(max = 200)
    @Column(name = "operator", length = 200)
    private String operator;

    @Column(name = "capacity", precision = 18, scale = 4)
    private BigDecimal capacity;

    @Column(name = "capacity_uom_id")
    private Integer capacityUomId;

    @Transient
    @JsonProperty
    private String capacityUomCode;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @NotNull
    @Column(name = "country_id", nullable = false)
    private Integer countryId;

    @Size(max = 20)
    @Column(name = "port_code", length = 20)
    private String portCode;

    @Size(max = 10)
    @Column(name = "unlocode", length = 10)
    private String unlocode;

    public Integer getLocationId() {
        return locationId;
    }

    public void setLocationId(Integer locationId) {
        this.locationId = locationId;
    }

    public Integer getLocationTypeId() {
        return locationTypeId;
    }

    public void setLocationTypeId(Integer locationTypeId) {
        this.locationTypeId = locationTypeId;
    }

    public String getLocationTypeCode() {
        return locationTypeCode;
    }

    public void setLocationTypeCode(String locationTypeCode) {
        this.locationTypeCode = locationTypeCode;
    }

    public String getLocationCode() {
        return locationCode;
    }

    public void setLocationCode(String locationCode) {
        this.locationCode = locationCode;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
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

    public String getPortCode() {
        return portCode;
    }

    public void setPortCode(String portCode) {
        this.portCode = portCode;
    }

    public String getUnlocode() {
        return unlocode;
    }

    public void setUnlocode(String unlocode) {
        this.unlocode = unlocode;
    }
}
