package com.etrm.system.pipeline;

import com.etrm.system.common.AuditableEntity;
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
import java.time.LocalDate;

/**
 * The frontend Pipeline type's originLocationId/destinationLocationId/
 * originLocationCode/destinationLocationCode/tariffCurrencyCode have NO
 * backing columns on dbo.pipeline — origin/destination actually belong on
 * the separate pipeline_point table (via pipeline_id + point_type) and
 * tariff currency lives per-row on pipeline_tariff.currency_id, not on
 * pipeline itself. This is a structural (not naming) mismatch per this
 * session's standing rule, so those fields are left unmapped/unexposed here
 * rather than faked. statusCode is likewise unmapped — dbo.pipeline has no
 * general lifecycle-status column (only is_active plus is_cross_border/
 * is_fungible/batch_scheduling booleans), unlike Vessel's vetting_status.
 * diameterInch is also left unmapped: the real column (diameter_mm) is a
 * different unit, and converting would fabricate data rather than translate
 * it — the real value is exposed instead as diameterMm.
 */
@Entity
@Table(name = "pipeline")
public class Pipeline extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pipeline_id")
    private Integer pipelineId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "pipeline_code", nullable = false, length = 30)
    private String pipelineCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "pipeline_name", nullable = false, length = 200)
    private String pipelineName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "pipeline_type", nullable = false, length = 20)
    private String pipelineType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "commodity_type", nullable = false, length = 20)
    private String commodityType;

    @NotNull
    @Column(name = "operator_id", nullable = false)
    private Integer operatorId;

    @Transient
    @JsonProperty
    private String operatorName;

    @Column(name = "owner_operator_id")
    private Integer ownerOperatorId;

    @Transient
    @JsonProperty
    private String ownerOperatorName;

    // Frontend's "tso" field.
    @Size(max = 50)
    @Column(name = "tso_code", length = 50)
    private String tso;

    @Size(max = 100)
    @Column(name = "regulatory_body", length = 100)
    private String regulatoryBody;

    @Size(max = 100)
    @Column(name = "regulatory_ref", length = 100)
    private String regulatoryRef;

    @Column(name = "length_km", precision = 10, scale = 2)
    private BigDecimal lengthKm;

    // SMALLINT -> Short. Frontend's diameterInch is a different unit and is
    // deliberately left unmapped — see class doc comment.
    @Column(name = "diameter_mm")
    private Short diameterMm;

    @Column(name = "max_operating_pressure", precision = 8, scale = 2)
    private BigDecimal maxOperatingPressure;

    // Frontend's "capacityPerDay" field.
    @Column(name = "max_capacity", precision = 18, scale = 4)
    private BigDecimal capacityPerDay;

    @Column(name = "max_capacity_uom_id")
    private Integer capacityUomId;

    @Transient
    @JsonProperty
    private String capacityUomCode;

    @NotBlank
    @Size(max = 20)
    @Column(name = "flow_direction", nullable = false, length = 20)
    private String flowDirection;

    @Size(max = 100)
    @Column(name = "country_codes", length = 100)
    private String countryCodes;

    @NotNull
    @Column(name = "is_cross_border", nullable = false)
    private Boolean isCrossBorder = false;

    @NotNull
    @Column(name = "is_fungible", nullable = false)
    private Boolean isFungible = false;

    @NotNull
    @Column(name = "batch_scheduling", nullable = false)
    private Boolean batchScheduling = false;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "commissioned_date")
    private LocalDate commissionedDate;

    @Column(name = "decommissioned_date")
    private LocalDate decommissionedDate;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    public Integer getPipelineId() {
        return pipelineId;
    }

    public void setPipelineId(Integer pipelineId) {
        this.pipelineId = pipelineId;
    }

    public String getPipelineCode() {
        return pipelineCode;
    }

    public void setPipelineCode(String pipelineCode) {
        this.pipelineCode = pipelineCode;
    }

    public String getPipelineName() {
        return pipelineName;
    }

    public void setPipelineName(String pipelineName) {
        this.pipelineName = pipelineName;
    }

    public String getPipelineType() {
        return pipelineType;
    }

    public void setPipelineType(String pipelineType) {
        this.pipelineType = pipelineType;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
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

    public Integer getOwnerOperatorId() {
        return ownerOperatorId;
    }

    public void setOwnerOperatorId(Integer ownerOperatorId) {
        this.ownerOperatorId = ownerOperatorId;
    }

    public String getOwnerOperatorName() {
        return ownerOperatorName;
    }

    public void setOwnerOperatorName(String ownerOperatorName) {
        this.ownerOperatorName = ownerOperatorName;
    }

    public String getTso() {
        return tso;
    }

    public void setTso(String tso) {
        this.tso = tso;
    }

    public String getRegulatoryBody() {
        return regulatoryBody;
    }

    public void setRegulatoryBody(String regulatoryBody) {
        this.regulatoryBody = regulatoryBody;
    }

    public String getRegulatoryRef() {
        return regulatoryRef;
    }

    public void setRegulatoryRef(String regulatoryRef) {
        this.regulatoryRef = regulatoryRef;
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

    public BigDecimal getCapacityPerDay() {
        return capacityPerDay;
    }

    public void setCapacityPerDay(BigDecimal capacityPerDay) {
        this.capacityPerDay = capacityPerDay;
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

    public String getFlowDirection() {
        return flowDirection;
    }

    public void setFlowDirection(String flowDirection) {
        this.flowDirection = flowDirection;
    }

    public String getCountryCodes() {
        return countryCodes;
    }

    public void setCountryCodes(String countryCodes) {
        this.countryCodes = countryCodes;
    }

    public Boolean getIsCrossBorder() {
        return isCrossBorder;
    }

    public void setIsCrossBorder(Boolean isCrossBorder) {
        this.isCrossBorder = isCrossBorder;
    }

    public Boolean getIsFungible() {
        return isFungible;
    }

    public void setIsFungible(Boolean isFungible) {
        this.isFungible = isFungible;
    }

    public Boolean getBatchScheduling() {
        return batchScheduling;
    }

    public void setBatchScheduling(Boolean batchScheduling) {
        this.batchScheduling = batchScheduling;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDate getCommissionedDate() {
        return commissionedDate;
    }

    public void setCommissionedDate(LocalDate commissionedDate) {
        this.commissionedDate = commissionedDate;
    }

    public LocalDate getDecommissionedDate() {
        return decommissionedDate;
    }

    public void setDecommissionedDate(LocalDate decommissionedDate) {
        this.decommissionedDate = decommissionedDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
