package com.etrm.system.nomination;

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
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * dbo.nomination has no real order_id FK it can be joined against yet — there
 * is no TradeOrder JPA entity anywhere in this codebase per an earlier
 * session's own scoping note ("trade/trade_order/trade_item/position remain
 * explicitly out of the Master Data build's scope"). orderId is therefore
 * stored/returned as a plain Integer and orderReference always serializes as
 * null, matching the frontend's nullable typing — no reader is invented ahead
 * of a future TradeOrder batch.
 */
@Entity
@Table(name = "nomination")
public class Nomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "nomination_id")
    private Integer nominationId;

    // V130 — optimistic locking (Batch C: Logistics). See LegalEntity.java for
    // the canonical pattern this batch replicates.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "order_id", nullable = false)
    private Integer orderId;

    @Transient
    @JsonProperty
    private String orderReference;

    @NotBlank
    @Size(max = 50)
    @Column(name = "nomination_reference", nullable = false, length = 50)
    private String nominationReference;

    @NotBlank
    @Size(max = 20)
    @Column(name = "nomination_type", nullable = false, length = 20)
    private String nominationType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @NotNull
    @Column(name = "nominated_quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal nominatedQuantity;

    @NotNull
    @Column(name = "uom_id", nullable = false)
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @NotNull
    @Column(name = "nomination_window_start", nullable = false)
    private LocalDate nominationWindowStart;

    @NotNull
    @Column(name = "nomination_window_end", nullable = false)
    private LocalDate nominationWindowEnd;

    @Column(name = "deadline_datetime")
    private LocalDateTime deadlineDatetime;

    @Column(name = "location_id")
    private Integer locationId;

    @Transient
    @JsonProperty
    private String locationName;

    @Size(max = 30)
    @Column(name = "pipeline_code", length = 30)
    private String pipelineCode;

    @Transient
    @JsonProperty
    private String pipelineName;

    @Column(name = "vessel_id")
    private Integer vesselId;

    @Transient
    @JsonProperty
    private String vesselName;

    @Column(name = "counterparty_id")
    private Integer counterpartyId;

    @Transient
    @JsonProperty
    private String counterpartyName;

    @Column(name = "submitted_by_user_id")
    private Integer submittedByUserId;

    @Transient
    @JsonProperty
    private String submittedByUserName;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Size(max = 1000)
    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Size(max = 4000)
    @Column(name = "notes", length = 4000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getNominationId() {
        return nominationId;
    }

    public void setNominationId(Integer nominationId) {
        this.nominationId = nominationId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getOrderReference() {
        return orderReference;
    }

    public void setOrderReference(String orderReference) {
        this.orderReference = orderReference;
    }

    public String getNominationReference() {
        return nominationReference;
    }

    public void setNominationReference(String nominationReference) {
        this.nominationReference = nominationReference;
    }

    public String getNominationType() {
        return nominationType;
    }

    public void setNominationType(String nominationType) {
        this.nominationType = nominationType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getNominatedQuantity() {
        return nominatedQuantity;
    }

    public void setNominatedQuantity(BigDecimal nominatedQuantity) {
        this.nominatedQuantity = nominatedQuantity;
    }

    public Integer getUomId() {
        return uomId;
    }

    public void setUomId(Integer uomId) {
        this.uomId = uomId;
    }

    public String getUomCode() {
        return uomCode;
    }

    public void setUomCode(String uomCode) {
        this.uomCode = uomCode;
    }

    public LocalDate getNominationWindowStart() {
        return nominationWindowStart;
    }

    public void setNominationWindowStart(LocalDate nominationWindowStart) {
        this.nominationWindowStart = nominationWindowStart;
    }

    public LocalDate getNominationWindowEnd() {
        return nominationWindowEnd;
    }

    public void setNominationWindowEnd(LocalDate nominationWindowEnd) {
        this.nominationWindowEnd = nominationWindowEnd;
    }

    public LocalDateTime getDeadlineDatetime() {
        return deadlineDatetime;
    }

    public void setDeadlineDatetime(LocalDateTime deadlineDatetime) {
        this.deadlineDatetime = deadlineDatetime;
    }

    public Integer getLocationId() {
        return locationId;
    }

    public void setLocationId(Integer locationId) {
        this.locationId = locationId;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
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

    public Integer getVesselId() {
        return vesselId;
    }

    public void setVesselId(Integer vesselId) {
        this.vesselId = vesselId;
    }

    public String getVesselName() {
        return vesselName;
    }

    public void setVesselName(String vesselName) {
        this.vesselName = vesselName;
    }

    public Integer getCounterpartyId() {
        return counterpartyId;
    }

    public void setCounterpartyId(Integer counterpartyId) {
        this.counterpartyId = counterpartyId;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public Integer getSubmittedByUserId() {
        return submittedByUserId;
    }

    public void setSubmittedByUserId(Integer submittedByUserId) {
        this.submittedByUserId = submittedByUserId;
    }

    public String getSubmittedByUserName() {
        return submittedByUserName;
    }

    public void setSubmittedByUserName(String submittedByUserName) {
        this.submittedByUserName = submittedByUserName;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
