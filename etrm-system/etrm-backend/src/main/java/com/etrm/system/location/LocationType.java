package com.etrm.system.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.etrm.system.lookup.TypeCodeLookup;

/**
 * Read path only, used to resolve Location.locationTypeId -> locationTypeCode.
 * Not registered/verified in master_data_table_registry here — no controller
 * built in this batch (per brief, skip building one).
 */
@Entity
@Table(name = "location_type")
public class LocationType extends TypeCodeLookup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_type_id")
    private Integer locationTypeId;

    @Column(name = "description", length = 300)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // FK -> dbo.commodity_type(commodity_type_id).
    @Column(name = "commodity_type")
    private Integer commodityType;

    public Integer getLocationTypeId() {
        return locationTypeId;
    }

    public void setLocationTypeId(Integer locationTypeId) {
        this.locationTypeId = locationTypeId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(Integer commodityType) {
        this.commodityType = commodityType;
    }
}
