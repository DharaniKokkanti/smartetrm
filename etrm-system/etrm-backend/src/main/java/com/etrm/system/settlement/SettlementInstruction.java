package com.etrm.system.settlement;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlement_instruction")
public class SettlementInstruction extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "settlement_instruction_id")
    private Integer settlementInstructionId;

    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "instruction_code", nullable = false, length = 30)
    private String instructionCode;

    @NotNull
    @Column(name = "our_entity_id", nullable = false)
    private Integer ourEntityId;

    // No @NotNull — set by CounterpartyController from the path variable
    // before this entity is persisted, same reasoning as BankAccount's
    // entityId (never client-trusted, so not required on the inbound body).
    @Column(name = "counterparty_id", nullable = false)
    private Integer counterpartyId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    private Direction direction;

    @Column(name = "currency_id")
    private Integer currencyId;

    @Column(name = "product_scope", length = 30)
    private String productScope;

    @NotNull
    @Column(name = "bank_account_id", nullable = false)
    private Integer bankAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.PENDING_VERIFICATION;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verification_method", length = 30)
    private String verificationMethod;

    @NotNull
    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "superseded_by_id")
    private Integer supersededById;

    @Column(name = "notes", length = 500)
    private String notes;

    public enum Direction { PAY, RECEIVE, BOTH }

    public enum Status { PENDING_VERIFICATION, ACTIVE, SUPERSEDED, REJECTED }

    public Integer getSettlementInstructionId() {
        return settlementInstructionId;
    }

    public void setSettlementInstructionId(Integer settlementInstructionId) {
        this.settlementInstructionId = settlementInstructionId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public String getInstructionCode() {
        return instructionCode;
    }

    public void setInstructionCode(String instructionCode) {
        this.instructionCode = instructionCode;
    }

    public Integer getOurEntityId() {
        return ourEntityId;
    }

    public void setOurEntityId(Integer ourEntityId) {
        this.ourEntityId = ourEntityId;
    }

    public Integer getCounterpartyId() {
        return counterpartyId;
    }

    public void setCounterpartyId(Integer counterpartyId) {
        this.counterpartyId = counterpartyId;
    }

    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public String getProductScope() {
        return productScope;
    }

    public void setProductScope(String productScope) {
        this.productScope = productScope;
    }

    public Integer getBankAccountId() {
        return bankAccountId;
    }

    public void setBankAccountId(Integer bankAccountId) {
        this.bankAccountId = bankAccountId;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getVerificationMethod() {
        return verificationMethod;
    }

    public void setVerificationMethod(String verificationMethod) {
        this.verificationMethod = verificationMethod;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDate validTo) {
        this.validTo = validTo;
    }

    public Integer getSupersededById() {
        return supersededById;
    }

    public void setSupersededById(Integer supersededById) {
        this.supersededById = supersededById;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
