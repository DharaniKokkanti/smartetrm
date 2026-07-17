package com.etrm.system.environmentalproduct;

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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * dbo.environmental_product — product_type is an int FK to
 * environmental_product_type, denormalized to/from the frontend's string
 * "productType" (type_code). scheme_id/registry_id are nullable FKs whose
 * display names (schemeName/registryName) are hydrated separately.
 */
@Entity
@Table(name = "environmental_product")
public class EnvironmentalProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Integer productId;

    @NotBlank
    @Size(max = 60)
    @Column(name = "product_code", nullable = false, length = 60)
    private String productCode;

    @NotBlank
    @Size(max = 400)
    @Column(name = "product_name", nullable = false, length = 400)
    private String productName;

    // No @NotNull — client only sends the denormalized code (see @JsonIgnore
    // below); this raw FK id is populated by resolveForeignKeys() AFTER Bean
    // Validation runs, so @NotNull here would reject every real request.
    @Column(name = "product_type", nullable = false)
    private Integer productType;

    @Transient
    private String productTypeCode;

    @Column(name = "scheme_id")
    private Integer schemeId;

    @Transient
    @JsonProperty
    private String schemeName;

    @Column(name = "registry_id")
    private Integer registryId;

    @Transient
    @JsonProperty
    private String registryName;

    @NotBlank
    @Size(max = 60)
    @Column(name = "unit_of_measure", nullable = false, length = 60)
    private String unitOfMeasure;

    @Column(name = "description", columnDefinition = "nvarchar(max)")
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    @JsonIgnore
    public Integer getProductType() {
        return productType;
    }

    @JsonIgnore
    public void setProductType(Integer productType) {
        this.productType = productType;
    }

    @JsonProperty("productType")
    public String getProductTypeCode() {
        return productTypeCode;
    }

    @JsonProperty("productType")
    public void setProductTypeCode(String productTypeCode) {
        this.productTypeCode = productTypeCode;
    }

    public Integer getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(Integer schemeId) {
        this.schemeId = schemeId;
    }

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
    }

    public Integer getRegistryId() {
        return registryId;
    }

    public void setRegistryId(Integer registryId) {
        this.registryId = registryId;
    }

    public String getRegistryName() {
        return registryName;
    }

    public void setRegistryName(String registryName) {
        this.registryName = registryName;
    }

    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
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
