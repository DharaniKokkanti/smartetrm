package com.etrm.system.pipeline;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * No frontend page in this batch — built as a real entity/repository only
 * (no controller) since pipeline_segment/pipeline_tariff have required FKs
 * into it. The frontend never got a dropdown built against this table, so
 * PipelineSegmentService/PipelineTariffService resolve the frontend's
 * free-text fromPointCode/toPointCode strings into real from_point_id/
 * to_point_id FK integers via findByPointCodeIgnoreCase, and denormalize
 * back to code for reads. No audit columns at all on this table.
 */
@Entity
@Table(name = "pipeline_point")
public class PipelinePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "point_id")
    private Integer pointId;

    @Column(name = "pipeline_id")
    private Integer pipelineId;

    @NotNull
    @Column(name = "location_id", nullable = false)
    private Integer locationId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "point_code", nullable = false, length = 30)
    private String pointCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "point_name", nullable = false, length = 200)
    private String pointName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "point_type", nullable = false, length = 20)
    private String pointType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "flow_direction", nullable = false, length = 20)
    private String flowDirection;

    @Column(name = "capacity", precision = 18, scale = 4)
    private BigDecimal capacity;

    @Column(name = "capacity_uom_id")
    private Integer capacityUomId;

    @Size(max = 50)
    @Column(name = "meter_ref", length = 50)
    private String meterRef;

    @Size(max = 50)
    @Column(name = "meter_type", length = 50)
    private String meterType;

    @Column(name = "interconnect_pipeline_id")
    private Integer interconnectPipelineId;

    @Column(name = "facility_id")
    private Integer facilityId;

    @Size(max = 30)
    @Column(name = "tariff_zone", length = 30)
    private String tariffZone;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getPointId() {
        return pointId;
    }

    public void setPointId(Integer pointId) {
        this.pointId = pointId;
    }

    public Integer getPipelineId() {
        return pipelineId;
    }

    public void setPipelineId(Integer pipelineId) {
        this.pipelineId = pipelineId;
    }

    public Integer getLocationId() {
        return locationId;
    }

    public void setLocationId(Integer locationId) {
        this.locationId = locationId;
    }

    public String getPointCode() {
        return pointCode;
    }

    public void setPointCode(String pointCode) {
        this.pointCode = pointCode;
    }

    public String getPointName() {
        return pointName;
    }

    public void setPointName(String pointName) {
        this.pointName = pointName;
    }

    public String getPointType() {
        return pointType;
    }

    public void setPointType(String pointType) {
        this.pointType = pointType;
    }

    public String getFlowDirection() {
        return flowDirection;
    }

    public void setFlowDirection(String flowDirection) {
        this.flowDirection = flowDirection;
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

    public String getMeterRef() {
        return meterRef;
    }

    public void setMeterRef(String meterRef) {
        this.meterRef = meterRef;
    }

    public String getMeterType() {
        return meterType;
    }

    public void setMeterType(String meterType) {
        this.meterType = meterType;
    }

    public Integer getInterconnectPipelineId() {
        return interconnectPipelineId;
    }

    public void setInterconnectPipelineId(Integer interconnectPipelineId) {
        this.interconnectPipelineId = interconnectPipelineId;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public String getTariffZone() {
        return tariffZone;
    }

    public void setTariffZone(String tariffZone) {
        this.tariffZone = tariffZone;
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
}
