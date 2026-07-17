package com.etrm.system.railcar;

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
import java.time.LocalDateTime;

/**
 * dbo.mot_asset_product_approval is a generic polymorphic table (asset_type
 * discriminator) shared across multiple asset types (railcar, truck, vessel,
 * ...). This entity/controller is the first backend built against it, scoped
 * only to asset_type='RAILCAR' via RailcarController's product-approvals
 * sub-resource — other asset types are not wired up yet.
 */
@Entity
@Table(name = "mot_asset_product_approval")
public class RailcarProductApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asset_approval_id")
    private Integer assetApprovalId;

    // No @NotBlank — RailcarController.addProductApproval() always sets this
    // server-side (to "RAILCAR") AFTER @Valid already ran on the deserialized
    // request body; the frontend's own RailcarProductApprovalInput type
    // correctly omits assetType from the payload, so @NotBlank here rejected
    // every real request with "assetType must not be blank".
    @Size(max = 20)
    @Column(name = "asset_type", nullable = false, length = 20)
    private String assetType;

    @NotNull
    @Column(name = "asset_id", nullable = false)
    private Integer assetId;

    @NotNull
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Transient
    @JsonProperty
    private String productName;

    @Column(name = "spec_template_id")
    private Integer specTemplateId;

    @Column(name = "max_quantity", precision = 18, scale = 4)
    private BigDecimal maxQuantity;

    @Column(name = "quantity_uom_id")
    private Integer quantityUomId;

    @Transient
    @JsonProperty
    private String quantityUomCode;

    @NotBlank
    @Size(max = 20)
    @Column(name = "approval_status", nullable = false, length = 20)
    private String approvalStatus;

    @Size(max = 500)
    @Column(name = "conditions", length = 500)
    private String conditions;

    @Size(max = 100)
    @Column(name = "regulatory_ref", length = 100)
    private String regulatoryRef;

    @NotNull
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 100)
    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getAssetApprovalId() {
        return assetApprovalId;
    }

    public void setAssetApprovalId(Integer assetApprovalId) {
        this.assetApprovalId = assetApprovalId;
    }

    public String getAssetType() {
        return assetType;
    }

    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }

    public Integer getAssetId() {
        return assetId;
    }

    public void setAssetId(Integer assetId) {
        this.assetId = assetId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getSpecTemplateId() {
        return specTemplateId;
    }

    public void setSpecTemplateId(Integer specTemplateId) {
        this.specTemplateId = specTemplateId;
    }

    public BigDecimal getMaxQuantity() {
        return maxQuantity;
    }

    public void setMaxQuantity(BigDecimal maxQuantity) {
        this.maxQuantity = maxQuantity;
    }

    public Integer getQuantityUomId() {
        return quantityUomId;
    }

    public void setQuantityUomId(Integer quantityUomId) {
        this.quantityUomId = quantityUomId;
    }

    public String getQuantityUomCode() {
        return quantityUomCode;
    }

    public void setQuantityUomCode(String quantityUomCode) {
        this.quantityUomCode = quantityUomCode;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getConditions() {
        return conditions;
    }

    public void setConditions(String conditions) {
        this.conditions = conditions;
    }

    public String getRegulatoryRef() {
        return regulatoryRef;
    }

    public void setRegulatoryRef(String regulatoryRef) {
        this.regulatoryRef = regulatoryRef;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
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
