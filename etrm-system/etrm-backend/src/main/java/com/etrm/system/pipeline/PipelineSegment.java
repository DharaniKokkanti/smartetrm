package com.etrm.system.pipeline;

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

/**
 * No audit columns on dbo.pipeline_segment. fromPointCode/toPointCode are
 * the frontend's plain-text stand-ins for from_point_id/to_point_id (no
 * dropdown was ever built against pipeline_point) — PipelineSegmentService
 * resolves them via PipelinePointRepository.findByPointCodeIgnoreCase.
 */
@Entity
@Table(name = "pipeline_segment")
public class PipelineSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "segment_id")
    private Integer segmentId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "pipeline_id", nullable = false)
    private Integer pipelineId;

    @Transient
    @JsonProperty
    private String pipelineName;

    // Not @NotNull: fromPointId/toPointId are always resolved from
    // fromPointCode/toPointCode by PipelineSegmentService.resolveForeignKeys
    // before save — the frontend never sends the raw ids (no dropdown was
    // built against pipeline_point, see its own class doc). Bean validation
    // on the raw @RequestBody runs before that resolution, so a @NotNull
    // here made every real create 400 (caught by
    // PipelineSegmentControllerTest). The DB's own NOT NULL constraint is
    // still the final backstop.
    @Column(name = "from_point_id", nullable = false)
    private Integer fromPointId;

    @Transient
    @JsonProperty
    private String fromPointCode;

    @Column(name = "to_point_id", nullable = false)
    private Integer toPointId;

    @Transient
    @JsonProperty
    private String toPointCode;

    @NotBlank
    @Size(max = 30)
    @Column(name = "segment_code", nullable = false, length = 30)
    private String segmentCode;

    @Size(max = 200)
    @Column(name = "segment_name", length = 200)
    private String segmentName;

    @Column(name = "length_km", precision = 8, scale = 2)
    private BigDecimal lengthKm;

    // SMALLINT -> Short.
    @Column(name = "diameter_mm")
    private Short diameterMm;

    @Column(name = "max_operating_pressure", precision = 8, scale = 2)
    private BigDecimal maxOperatingPressure;

    @Column(name = "forward_capacity", precision = 18, scale = 4)
    private BigDecimal forwardCapacity;

    @Column(name = "reverse_capacity", precision = 18, scale = 4)
    private BigDecimal reverseCapacity;

    @Column(name = "capacity_uom_id")
    private Integer capacityUomId;

    @Size(max = 30)
    @Column(name = "tariff_zone", length = 30)
    private String tariffZone;

    @NotBlank
    @Size(max = 20)
    @Column(name = "operational_status", nullable = false, length = 20)
    private String operationalStatus;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getSegmentId() {
        return segmentId;
    }

    public void setSegmentId(Integer segmentId) {
        this.segmentId = segmentId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getPipelineId() {
        return pipelineId;
    }

    public void setPipelineId(Integer pipelineId) {
        this.pipelineId = pipelineId;
    }

    public String getPipelineName() {
        return pipelineName;
    }

    public void setPipelineName(String pipelineName) {
        this.pipelineName = pipelineName;
    }

    public Integer getFromPointId() {
        return fromPointId;
    }

    public void setFromPointId(Integer fromPointId) {
        this.fromPointId = fromPointId;
    }

    public String getFromPointCode() {
        return fromPointCode;
    }

    public void setFromPointCode(String fromPointCode) {
        this.fromPointCode = fromPointCode;
    }

    public Integer getToPointId() {
        return toPointId;
    }

    public void setToPointId(Integer toPointId) {
        this.toPointId = toPointId;
    }

    public String getToPointCode() {
        return toPointCode;
    }

    public void setToPointCode(String toPointCode) {
        this.toPointCode = toPointCode;
    }

    public String getSegmentCode() {
        return segmentCode;
    }

    public void setSegmentCode(String segmentCode) {
        this.segmentCode = segmentCode;
    }

    public String getSegmentName() {
        return segmentName;
    }

    public void setSegmentName(String segmentName) {
        this.segmentName = segmentName;
    }

    public BigDecimal getLengthKm() {
        return lengthKm;
    }

    public void setLengthKm(BigDecimal lengthKm) {
        this.lengthKm = lengthKm;
    }

    public Short getDiameterMm() {
        return diameterMm;
    }

    public void setDiameterMm(Short diameterMm) {
        this.diameterMm = diameterMm;
    }

    public BigDecimal getMaxOperatingPressure() {
        return maxOperatingPressure;
    }

    public void setMaxOperatingPressure(BigDecimal maxOperatingPressure) {
        this.maxOperatingPressure = maxOperatingPressure;
    }

    public BigDecimal getForwardCapacity() {
        return forwardCapacity;
    }

    public void setForwardCapacity(BigDecimal forwardCapacity) {
        this.forwardCapacity = forwardCapacity;
    }

    public BigDecimal getReverseCapacity() {
        return reverseCapacity;
    }

    public void setReverseCapacity(BigDecimal reverseCapacity) {
        this.reverseCapacity = reverseCapacity;
    }

    public Integer getCapacityUomId() {
        return capacityUomId;
    }

    public void setCapacityUomId(Integer capacityUomId) {
        this.capacityUomId = capacityUomId;
    }

    public String getTariffZone() {
        return tariffZone;
    }

    public void setTariffZone(String tariffZone) {
        this.tariffZone = tariffZone;
    }

    public String getOperationalStatus() {
        return operationalStatus;
    }

    public void setOperationalStatus(String operationalStatus) {
        this.operationalStatus = operationalStatus;
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
