package com.etrm.system.product;

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

@Entity
@Table(name = "product_spec_value")
public class ProductSpecValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "spec_value_id")
    private Integer specValueId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "template_id", nullable = false)
    private Integer templateId;

    @NotNull
    @Column(name = "parameter_id", nullable = false)
    private Integer parameterId;

    @Transient
    @JsonProperty
    private String parameterCode;

    @Transient
    @JsonProperty
    private String parameterName;

    @Transient
    @JsonProperty
    private String parameterCategory;

    @Column(name = "uom_id")
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @Column(name = "value_min")
    private BigDecimal valueMin;

    @Column(name = "value_max")
    private BigDecimal valueMax;

    @Column(name = "value_typical")
    private BigDecimal valueTypical;

    @Column(name = "value_exact")
    private BigDecimal valueExact;

    @Size(max = 200)
    @Column(name = "value_text", length = 200)
    private String valueText;

    @NotBlank
    @Column(name = "bound_direction", nullable = false, length = 20)
    private String boundDirection;

    @NotNull
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = false;

    @Size(max = 100)
    @Column(name = "test_method", length = 100)
    private String testMethod;

    @Size(max = 300)
    @Column(name = "notes", length = 300)
    private String notes;

    public Integer getSpecValueId() {
        return specValueId;
    }

    public void setSpecValueId(Integer specValueId) {
        this.specValueId = specValueId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Integer templateId) {
        this.templateId = templateId;
    }

    public Integer getParameterId() {
        return parameterId;
    }

    public void setParameterId(Integer parameterId) {
        this.parameterId = parameterId;
    }

    public String getParameterCode() {
        return parameterCode;
    }

    public void setParameterCode(String parameterCode) {
        this.parameterCode = parameterCode;
    }

    public String getParameterName() {
        return parameterName;
    }

    public void setParameterName(String parameterName) {
        this.parameterName = parameterName;
    }

    public String getParameterCategory() {
        return parameterCategory;
    }

    public void setParameterCategory(String parameterCategory) {
        this.parameterCategory = parameterCategory;
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

    public BigDecimal getValueMin() {
        return valueMin;
    }

    public void setValueMin(BigDecimal valueMin) {
        this.valueMin = valueMin;
    }

    public BigDecimal getValueMax() {
        return valueMax;
    }

    public void setValueMax(BigDecimal valueMax) {
        this.valueMax = valueMax;
    }

    public BigDecimal getValueTypical() {
        return valueTypical;
    }

    public void setValueTypical(BigDecimal valueTypical) {
        this.valueTypical = valueTypical;
    }

    public BigDecimal getValueExact() {
        return valueExact;
    }

    public void setValueExact(BigDecimal valueExact) {
        this.valueExact = valueExact;
    }

    public String getValueText() {
        return valueText;
    }

    public void setValueText(String valueText) {
        this.valueText = valueText;
    }

    public String getBoundDirection() {
        return boundDirection;
    }

    public void setBoundDirection(String boundDirection) {
        this.boundDirection = boundDirection;
    }

    public Boolean getIsMandatory() {
        return isMandatory;
    }

    public void setIsMandatory(Boolean isMandatory) {
        this.isMandatory = isMandatory;
    }

    public String getTestMethod() {
        return testMethod;
    }

    public void setTestMethod(String testMethod) {
        this.testMethod = testMethod;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
