package com.etrm.system.location;

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
 * dbo.location — port_code/unlocode added by V103 (small, justified frontend
 * gap — see that migration's comment). The frontend LocationTypeCode is a
 * plain code string, not the numeric location_type_id FK — LocationService
 * resolves locationTypeCode <-> locationTypeId via LocationTypeRepository,
 * same pattern as MarketService's commodityType resolution.
 *
 * V147 — added updated_at/updated_by and upgraded created_at/created_by to
 * real @CreatedDate/@CreatedBy JPA auditing (previously set manually by
 * LocationService).
 */
@Entity
@Table(name = "location")
@EntityListeners(AuditingEntityListener.class)
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_id")
    private Integer locationId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    // Not @NotNull: the frontend LocationTypeCode is a plain code string,
    // not the numeric location_type_id FK (see this class's own doc
    // comment) — LocationService.resolveForeignKeys resolves
    // locationTypeCode -> locationTypeId before save. Bean validation on
    // the raw @RequestBody runs before that resolution, so a @NotNull here
    // made every real code-only create 400 (caught by
    // LocationControllerTest.create_with_locationTypeCode_only_resolves_locationTypeId
    // — same bug pattern found and fixed elsewhere this session). The DB's
    // own NOT NULL constraint is still the final backstop.
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

    @NotNull
    @Column(name = "country_id", nullable = false)
    private Integer countryId;

    @Size(max = 20)
    @Column(name = "port_code", length = 20)
    private String portCode;

    @Size(max = 10)
    @Column(name = "unlocode", length = 10)
    private String unlocode;

    // V118 — scopes this row to office/desk use, orthogonal to
    // location_type_id's logistics classification. Both NOT NULL in the DB
    // with a default of 0.
    @NotNull
    @Column(name = "office_loc_ind", nullable = false)
    private Boolean officeLocInd = false;

    @NotNull
    @Column(name = "trading_desk_ind", nullable = false)
    private Boolean tradingDeskInd = false;

    public Integer getLocationId() {
        return locationId;
    }

    public void setLocationId(Integer locationId) {
        this.locationId = locationId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public Boolean getOfficeLocInd() {
        return officeLocInd;
    }

    public void setOfficeLocInd(Boolean officeLocInd) {
        this.officeLocInd = officeLocInd;
    }

    public Boolean getTradingDeskInd() {
        return tradingDeskInd;
    }

    public void setTradingDeskInd(Boolean tradingDeskInd) {
        this.tradingDeskInd = tradingDeskInd;
    }
}
