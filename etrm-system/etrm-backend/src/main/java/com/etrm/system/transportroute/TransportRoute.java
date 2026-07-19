package com.etrm.system.transportroute;

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
import java.time.LocalDateTime;

/**
 * dbo.transport_route already existed live with real data (referenced by
 * dbo.position.route_id) but had no dedicated controller — the frontend's
 * own dedicated page (features/logistics/transport-routes) called
 * /freight/routes expecting one, 404ing against the real backend.
 */
@Entity
@Table(name = "transport_route")
public class TransportRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id")
    private Integer routeId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "mot_type_id", nullable = false)
    private Integer motTypeId;

    @Transient
    @JsonProperty
    private String motTypeName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "route_code", nullable = false, length = 30)
    private String routeCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "route_name", nullable = false, length = 200)
    private String routeName;

    @NotNull
    @Column(name = "origin_location_id", nullable = false)
    private Integer originLocationId;

    @Transient
    @JsonProperty
    private String originLocationName;

    @NotNull
    @Column(name = "dest_location_id", nullable = false)
    private Integer destLocationId;

    @Transient
    @JsonProperty
    private String destLocationName;

    @Size(max = 500)
    @Column(name = "via_location_ids", length = 500)
    private String viaLocationIds;

    @Column(name = "distance_km", precision = 9, scale = 1)
    private BigDecimal distanceKm;

    @Column(name = "transit_days_min")
    private Short transitDaysMin;

    @Column(name = "transit_days_max")
    private Short transitDaysMax;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @Size(max = 100)
    @Column(name = "max_vessel_size", length = 100)
    private String maxVesselSize;

    @Size(max = 200)
    @Column(name = "seasonal_restriction", length = 200)
    private String seasonalRestriction;

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

    public Integer getRouteId() {
        return routeId;
    }

    public void setRouteId(Integer routeId) {
        this.routeId = routeId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getMotTypeId() {
        return motTypeId;
    }

    public void setMotTypeId(Integer motTypeId) {
        this.motTypeId = motTypeId;
    }

    public String getMotTypeName() {
        return motTypeName;
    }

    public void setMotTypeName(String motTypeName) {
        this.motTypeName = motTypeName;
    }

    public String getRouteCode() {
        return routeCode;
    }

    public void setRouteCode(String routeCode) {
        this.routeCode = routeCode;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public Integer getOriginLocationId() {
        return originLocationId;
    }

    public void setOriginLocationId(Integer originLocationId) {
        this.originLocationId = originLocationId;
    }

    public String getOriginLocationName() {
        return originLocationName;
    }

    public void setOriginLocationName(String originLocationName) {
        this.originLocationName = originLocationName;
    }

    public Integer getDestLocationId() {
        return destLocationId;
    }

    public void setDestLocationId(Integer destLocationId) {
        this.destLocationId = destLocationId;
    }

    public String getDestLocationName() {
        return destLocationName;
    }

    public void setDestLocationName(String destLocationName) {
        this.destLocationName = destLocationName;
    }

    public String getViaLocationIds() {
        return viaLocationIds;
    }

    public void setViaLocationIds(String viaLocationIds) {
        this.viaLocationIds = viaLocationIds;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Short getTransitDaysMin() {
        return transitDaysMin;
    }

    public void setTransitDaysMin(Short transitDaysMin) {
        this.transitDaysMin = transitDaysMin;
    }

    public Short getTransitDaysMax() {
        return transitDaysMax;
    }

    public void setTransitDaysMax(Short transitDaysMax) {
        this.transitDaysMax = transitDaysMax;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public String getMaxVesselSize() {
        return maxVesselSize;
    }

    public void setMaxVesselSize(String maxVesselSize) {
        this.maxVesselSize = maxVesselSize;
    }

    public String getSeasonalRestriction() {
        return seasonalRestriction;
    }

    public void setSeasonalRestriction(String seasonalRestriction) {
        this.seasonalRestriction = seasonalRestriction;
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
}
