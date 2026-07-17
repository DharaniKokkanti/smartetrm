package com.etrm.system.formulatemplate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * dbo.formula_template — only created_at/created_by exist live (no
 * updated_at/updated_by), mapped manually with @CreatedDate/@CreatedBy like
 * Period.java, not via AuditableEntity. commodity_type, formula_type,
 * averaging_type, averaging_period_type and fx_fixing_type are all plain
 * CHECK-constrained strings, not FKs, matching the frontend's string-union
 * types. Referenced by dbo.pricing_rule.formula_template_id — see
 * PricingRule.java for where formula_expression/averaging_type get
 * borrowed onto the pricing rule's hydrated response.
 */
@Entity
@Table(name = "formula_template")
@EntityListeners(AuditingEntityListener.class)
public class FormulaTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Integer templateId;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @NotBlank
    @Size(max = 30)
    @Column(name = "template_code", nullable = false, length = 30)
    private String templateCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "template_name", nullable = false, length = 200)
    private String templateName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "formula_type", nullable = false, length = 20)
    private String formulaType;

    @Size(max = 500)
    @Column(name = "formula_expression", length = 500)
    private String formulaExpression;

    @Size(max = 20)
    @Column(name = "averaging_type", length = 20)
    private String averagingType;

    @Size(max = 20)
    @Column(name = "averaging_period_type", length = 20)
    private String averagingPeriodType;

    @NotNull
    @Column(name = "fx_conversion_required", nullable = false)
    private Boolean fxConversionRequired = false;

    @Size(max = 20)
    @Column(name = "fx_fixing_type", length = 20)
    private String fxFixingType;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    public Integer getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Integer templateId) {
        this.templateId = templateId;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getFormulaType() {
        return formulaType;
    }

    public void setFormulaType(String formulaType) {
        this.formulaType = formulaType;
    }

    public String getFormulaExpression() {
        return formulaExpression;
    }

    public void setFormulaExpression(String formulaExpression) {
        this.formulaExpression = formulaExpression;
    }

    public String getAveragingType() {
        return averagingType;
    }

    public void setAveragingType(String averagingType) {
        this.averagingType = averagingType;
    }

    public String getAveragingPeriodType() {
        return averagingPeriodType;
    }

    public void setAveragingPeriodType(String averagingPeriodType) {
        this.averagingPeriodType = averagingPeriodType;
    }

    public Boolean getFxConversionRequired() {
        return fxConversionRequired;
    }

    public void setFxConversionRequired(Boolean fxConversionRequired) {
        this.fxConversionRequired = fxConversionRequired;
    }

    public String getFxFixingType() {
        return fxFixingType;
    }

    public void setFxFixingType(String fxFixingType) {
        this.fxFixingType = fxFixingType;
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
}
