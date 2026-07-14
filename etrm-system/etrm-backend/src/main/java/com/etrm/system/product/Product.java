package com.etrm.system.product;

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
import java.time.LocalDateTime;

/**
 * This class replaces the batch-4 minimal read-only Product reader
 * (upgraded in place, same pattern as Market in batch 5) — BrokerFeeAgreement
 * still resolves productName through this same entity/repository, now with
 * full CRUD. updated_at/updated_by are genuinely NULLABLE on this table
 * (unlike most AuditableEntity-shaped tables) — mapped directly here rather
 * than extending AuditableEntity, which assumes NOT NULL for both.
 * default_pricing_type_id/default_uom_id/default_currency_id/
 * default_incoterm_id FK dedicated tables and resolve to their string code
 * for the frontend; settlement_type/commodity_id/commodity_family_id are
 * already plain numeric ids on the frontend (no translation needed).
 */
@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Integer productId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "product_code", nullable = false, length = 30)
    private String productCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @NotNull
    @Column(name = "commodity_id", nullable = false)
    private Integer commodityId;

    @NotNull
    @Column(name = "settlement_type", nullable = false)
    private Integer settlementType;

    // FK -> dbo.pricing_type(pricing_type_id). Frontend sends/receives type_code.
    @Column(name = "default_pricing_type_id")
    private Integer defaultPricingTypeId;

    @Transient
    private String defaultPricingTypeCode;

    // FK -> dbo.unit_of_measure(uom_id). Frontend sends/receives uom_code.
    @Column(name = "default_uom_id")
    private Integer defaultUomId;

    @Transient
    private String defaultUomCode;

    // FK -> dbo.currency(currency_id). Frontend sends/receives currency_code.
    @Column(name = "default_currency_id")
    private Integer defaultCurrencyId;

    @Transient
    private String defaultCurrencyCode;

    // FK -> dbo.incoterm(incoterm_id). Frontend sends/receives code.
    @Column(name = "default_incoterm_id")
    private Integer defaultIncotermId;

    @Transient
    private String defaultIncotermCode;

    @Column(name = "lot_size")
    private BigDecimal lotSize;

    @Column(name = "min_quantity")
    private BigDecimal minQuantity;

    @Column(name = "max_quantity")
    private BigDecimal maxQuantity;

    @Size(max = 30)
    @Column(name = "grade_code", length = 30)
    private String gradeCode;

    @Column(name = "commodity_family_id")
    private Integer commodityFamilyId;

    @Size(max = 50)
    @Column(name = "bloomberg_ticker", length = 50)
    private String bloombergTicker;

    @Size(max = 50)
    @Column(name = "reuters_ric", length = 50)
    private String reutersRic;

    @Size(max = 50)
    @Column(name = "platts_code", length = 50)
    private String plattsCode;

    @NotNull
    @Column(name = "is_exchange_traded", nullable = false)
    private Boolean isExchangeTraded = false;

    @NotNull
    @Column(name = "is_otc", nullable = false)
    private Boolean isOtc = false;

    @NotNull
    @Column(name = "is_blend", nullable = false)
    private Boolean isBlend = false;

    @Size(max = 500)
    @Column(name = "blend_notes", length = 500)
    private String blendNotes;

    @Column(name = "density_estimate_kg_m3")
    private BigDecimal densityEstimateKgM3;

    @Column(name = "density_base_kg_m3")
    private BigDecimal densityBaseKgM3;

    @Column(name = "cv_gross_mj_scm")
    private BigDecimal cvGrossMjScm;

    @Column(name = "cv_net_mj_scm")
    private BigDecimal cvNetMjScm;

    @Column(name = "purity_basis_pct")
    private BigDecimal purityBasisPct;

    @Column(name = "moisture_basis_pct")
    private BigDecimal moistureBasisPct;

    @Column(name = "protein_basis_pct")
    private BigDecimal proteinBasisPct;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

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

    public Integer getCommodityId() {
        return commodityId;
    }

    public void setCommodityId(Integer commodityId) {
        this.commodityId = commodityId;
    }

    public Integer getSettlementType() {
        return settlementType;
    }

    public void setSettlementType(Integer settlementType) {
        this.settlementType = settlementType;
    }

    public Integer getDefaultPricingTypeId() {
        return defaultPricingTypeId;
    }

    public void setDefaultPricingTypeId(Integer defaultPricingTypeId) {
        this.defaultPricingTypeId = defaultPricingTypeId;
    }

    @JsonProperty("defaultPricingTypeCode")
    public String getDefaultPricingTypeCode() {
        return defaultPricingTypeCode;
    }

    @JsonProperty("defaultPricingTypeCode")
    public void setDefaultPricingTypeCode(String defaultPricingTypeCode) {
        this.defaultPricingTypeCode = defaultPricingTypeCode;
    }

    public Integer getDefaultUomId() {
        return defaultUomId;
    }

    public void setDefaultUomId(Integer defaultUomId) {
        this.defaultUomId = defaultUomId;
    }

    @JsonProperty("defaultUomCode")
    public String getDefaultUomCode() {
        return defaultUomCode;
    }

    @JsonProperty("defaultUomCode")
    public void setDefaultUomCode(String defaultUomCode) {
        this.defaultUomCode = defaultUomCode;
    }

    public Integer getDefaultCurrencyId() {
        return defaultCurrencyId;
    }

    public void setDefaultCurrencyId(Integer defaultCurrencyId) {
        this.defaultCurrencyId = defaultCurrencyId;
    }

    @JsonProperty("defaultCurrencyCode")
    public String getDefaultCurrencyCode() {
        return defaultCurrencyCode;
    }

    @JsonProperty("defaultCurrencyCode")
    public void setDefaultCurrencyCode(String defaultCurrencyCode) {
        this.defaultCurrencyCode = defaultCurrencyCode;
    }

    public Integer getDefaultIncotermId() {
        return defaultIncotermId;
    }

    public void setDefaultIncotermId(Integer defaultIncotermId) {
        this.defaultIncotermId = defaultIncotermId;
    }

    @JsonProperty("defaultIncotermCode")
    public String getDefaultIncotermCode() {
        return defaultIncotermCode;
    }

    @JsonProperty("defaultIncotermCode")
    public void setDefaultIncotermCode(String defaultIncotermCode) {
        this.defaultIncotermCode = defaultIncotermCode;
    }

    public BigDecimal getLotSize() {
        return lotSize;
    }

    public void setLotSize(BigDecimal lotSize) {
        this.lotSize = lotSize;
    }

    public BigDecimal getMinQuantity() {
        return minQuantity;
    }

    public void setMinQuantity(BigDecimal minQuantity) {
        this.minQuantity = minQuantity;
    }

    public BigDecimal getMaxQuantity() {
        return maxQuantity;
    }

    public void setMaxQuantity(BigDecimal maxQuantity) {
        this.maxQuantity = maxQuantity;
    }

    public String getGradeCode() {
        return gradeCode;
    }

    public void setGradeCode(String gradeCode) {
        this.gradeCode = gradeCode;
    }

    public Integer getCommodityFamilyId() {
        return commodityFamilyId;
    }

    public void setCommodityFamilyId(Integer commodityFamilyId) {
        this.commodityFamilyId = commodityFamilyId;
    }

    public String getBloombergTicker() {
        return bloombergTicker;
    }

    public void setBloombergTicker(String bloombergTicker) {
        this.bloombergTicker = bloombergTicker;
    }

    public String getReutersRic() {
        return reutersRic;
    }

    public void setReutersRic(String reutersRic) {
        this.reutersRic = reutersRic;
    }

    public String getPlattsCode() {
        return plattsCode;
    }

    public void setPlattsCode(String plattsCode) {
        this.plattsCode = plattsCode;
    }

    public Boolean getIsExchangeTraded() {
        return isExchangeTraded;
    }

    public void setIsExchangeTraded(Boolean isExchangeTraded) {
        this.isExchangeTraded = isExchangeTraded;
    }

    public Boolean getIsOtc() {
        return isOtc;
    }

    public void setIsOtc(Boolean isOtc) {
        this.isOtc = isOtc;
    }

    public Boolean getIsBlend() {
        return isBlend;
    }

    public void setIsBlend(Boolean isBlend) {
        this.isBlend = isBlend;
    }

    public String getBlendNotes() {
        return blendNotes;
    }

    public void setBlendNotes(String blendNotes) {
        this.blendNotes = blendNotes;
    }

    public BigDecimal getDensityEstimateKgM3() {
        return densityEstimateKgM3;
    }

    public void setDensityEstimateKgM3(BigDecimal densityEstimateKgM3) {
        this.densityEstimateKgM3 = densityEstimateKgM3;
    }

    public BigDecimal getDensityBaseKgM3() {
        return densityBaseKgM3;
    }

    public void setDensityBaseKgM3(BigDecimal densityBaseKgM3) {
        this.densityBaseKgM3 = densityBaseKgM3;
    }

    public BigDecimal getCvGrossMjScm() {
        return cvGrossMjScm;
    }

    public void setCvGrossMjScm(BigDecimal cvGrossMjScm) {
        this.cvGrossMjScm = cvGrossMjScm;
    }

    public BigDecimal getCvNetMjScm() {
        return cvNetMjScm;
    }

    public void setCvNetMjScm(BigDecimal cvNetMjScm) {
        this.cvNetMjScm = cvNetMjScm;
    }

    public BigDecimal getPurityBasisPct() {
        return purityBasisPct;
    }

    public void setPurityBasisPct(BigDecimal purityBasisPct) {
        this.purityBasisPct = purityBasisPct;
    }

    public BigDecimal getMoistureBasisPct() {
        return moistureBasisPct;
    }

    public void setMoistureBasisPct(BigDecimal moistureBasisPct) {
        this.moistureBasisPct = moistureBasisPct;
    }

    public BigDecimal getProteinBasisPct() {
        return proteinBasisPct;
    }

    public void setProteinBasisPct(BigDecimal proteinBasisPct) {
        this.proteinBasisPct = proteinBasisPct;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
