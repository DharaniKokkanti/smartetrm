package com.etrm.system.deliveryinstruction;

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
 * dbo.delivery_instruction's order_id has no TradeOrder JPA entity to join
 * against anywhere in this codebase (same scoping note as Nomination) —
 * orderId is a plain Integer and orderReference always serializes as null.
 */
@Entity
@Table(name = "delivery_instruction")
public class DeliveryInstruction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delivery_instruction_id")
    private Integer deliveryInstructionId;

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

    @Column(name = "nomination_id")
    private Integer nominationId;

    @Transient
    @JsonProperty
    private String nominationReference;

    @NotBlank
    @Size(max = 50)
    @Column(name = "instruction_reference", nullable = false, length = 50)
    private String instructionReference;

    @NotBlank
    @Size(max = 20)
    @Column(name = "instruction_type", nullable = false, length = 20)
    private String instructionType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @NotNull
    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;

    @NotNull
    @Column(name = "uom_id", nullable = false)
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @Column(name = "location_id")
    private Integer locationId;

    @Transient
    @JsonProperty
    private String locationName;

    @Column(name = "tank_id")
    private Integer tankId;

    @Transient
    @JsonProperty
    private String tankNumber;

    @Size(max = 50)
    @Column(name = "berth", length = 50)
    private String berth;

    @Column(name = "terminal_agent_counterparty_id")
    private Integer terminalAgentCounterpartyId;

    @Transient
    @JsonProperty
    private String terminalAgentCounterpartyName;

    @NotNull
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Size(max = 4000)
    @Column(name = "notes", length = 4000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getDeliveryInstructionId() {
        return deliveryInstructionId;
    }

    public void setDeliveryInstructionId(Integer deliveryInstructionId) {
        this.deliveryInstructionId = deliveryInstructionId;
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

    public Integer getNominationId() {
        return nominationId;
    }

    public void setNominationId(Integer nominationId) {
        this.nominationId = nominationId;
    }

    public String getNominationReference() {
        return nominationReference;
    }

    public void setNominationReference(String nominationReference) {
        this.nominationReference = nominationReference;
    }

    public String getInstructionReference() {
        return instructionReference;
    }

    public void setInstructionReference(String instructionReference) {
        this.instructionReference = instructionReference;
    }

    public String getInstructionType() {
        return instructionType;
    }

    public void setInstructionType(String instructionType) {
        this.instructionType = instructionType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
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

    public Integer getTankId() {
        return tankId;
    }

    public void setTankId(Integer tankId) {
        this.tankId = tankId;
    }

    public String getTankNumber() {
        return tankNumber;
    }

    public void setTankNumber(String tankNumber) {
        this.tankNumber = tankNumber;
    }

    public String getBerth() {
        return berth;
    }

    public void setBerth(String berth) {
        this.berth = berth;
    }

    public Integer getTerminalAgentCounterpartyId() {
        return terminalAgentCounterpartyId;
    }

    public void setTerminalAgentCounterpartyId(Integer terminalAgentCounterpartyId) {
        this.terminalAgentCounterpartyId = terminalAgentCounterpartyId;
    }

    public String getTerminalAgentCounterpartyName() {
        return terminalAgentCounterpartyName;
    }

    public void setTerminalAgentCounterpartyName(String terminalAgentCounterpartyName) {
        this.terminalAgentCounterpartyName = terminalAgentCounterpartyName;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public LocalDate getActualDate() {
        return actualDate;
    }

    public void setActualDate(LocalDate actualDate) {
        this.actualDate = actualDate;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
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
