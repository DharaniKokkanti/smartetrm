package com.etrm.system.guarantee;

import com.etrm.system.common.AuditableEntity;
import com.etrm.system.polymorphic.EntityType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "parent_company_guarantee")
public class ParentCompanyGuarantee extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pcg_id")
    private Long pcgId;

    @NotBlank
    @Column(name = "pcg_reference", nullable = false, length = 50)
    private String pcgReference;

    @NotBlank
    @Column(name = "direction", nullable = false, length = 20)
    private String direction;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "guarantor_entity_type", nullable = false, length = 20)
    private EntityType guarantorEntityType;

    @NotNull
    @Column(name = "guarantor_entity_id", nullable = false)
    private Long guarantorEntityId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "principal_entity_type", nullable = false, length = 20)
    private EntityType principalEntityType;

    @NotNull
    @Column(name = "principal_entity_id", nullable = false)
    private Long principalEntityId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "beneficiary_entity_type", nullable = false, length = 20)
    private EntityType beneficiaryEntityType;

    @NotNull
    @Column(name = "beneficiary_entity_id", nullable = false)
    private Long beneficiaryEntityId;

    @NotNull
    @Column(name = "guarantee_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal guaranteeAmount;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Long currencyId;

    @NotNull
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "is_evergreen", nullable = false)
    private Boolean isEvergreen = false;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @NotBlank
    @Column(name = "pcg_status", nullable = false, length = 20)
    private String pcgStatus = "DRAFT";

    @Column(name = "amount_called", precision = 18, scale = 2)
    private BigDecimal amountCalled;

    @Column(name = "document_store_id")
    private Long documentStoreId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes", length = 500)
    private String notes;

    public Long getPcgId() {
        return pcgId;
    }

    public void setPcgId(Long pcgId) {
        this.pcgId = pcgId;
    }

    public String getPcgReference() {
        return pcgReference;
    }

    public void setPcgReference(String pcgReference) {
        this.pcgReference = pcgReference;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public EntityType getGuarantorEntityType() {
        return guarantorEntityType;
    }

    public void setGuarantorEntityType(EntityType guarantorEntityType) {
        this.guarantorEntityType = guarantorEntityType;
    }

    public Long getGuarantorEntityId() {
        return guarantorEntityId;
    }

    public void setGuarantorEntityId(Long guarantorEntityId) {
        this.guarantorEntityId = guarantorEntityId;
    }

    public EntityType getPrincipalEntityType() {
        return principalEntityType;
    }

    public void setPrincipalEntityType(EntityType principalEntityType) {
        this.principalEntityType = principalEntityType;
    }

    public Long getPrincipalEntityId() {
        return principalEntityId;
    }

    public void setPrincipalEntityId(Long principalEntityId) {
        this.principalEntityId = principalEntityId;
    }

    public EntityType getBeneficiaryEntityType() {
        return beneficiaryEntityType;
    }

    public void setBeneficiaryEntityType(EntityType beneficiaryEntityType) {
        this.beneficiaryEntityType = beneficiaryEntityType;
    }

    public Long getBeneficiaryEntityId() {
        return beneficiaryEntityId;
    }

    public void setBeneficiaryEntityId(Long beneficiaryEntityId) {
        this.beneficiaryEntityId = beneficiaryEntityId;
    }

    public BigDecimal getGuaranteeAmount() {
        return guaranteeAmount;
    }

    public void setGuaranteeAmount(BigDecimal guaranteeAmount) {
        this.guaranteeAmount = guaranteeAmount;
    }

    public Long getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Long currencyId) {
        this.currencyId = currencyId;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public Boolean getIsEvergreen() {
        return isEvergreen;
    }

    public void setIsEvergreen(Boolean isEvergreen) {
        this.isEvergreen = isEvergreen;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getPcgStatus() {
        return pcgStatus;
    }

    public void setPcgStatus(String pcgStatus) {
        this.pcgStatus = pcgStatus;
    }

    public BigDecimal getAmountCalled() {
        return amountCalled;
    }

    public void setAmountCalled(BigDecimal amountCalled) {
        this.amountCalled = amountCalled;
    }

    public Long getDocumentStoreId() {
        return documentStoreId;
    }

    public void setDocumentStoreId(Long documentStoreId) {
        this.documentStoreId = documentStoreId;
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
