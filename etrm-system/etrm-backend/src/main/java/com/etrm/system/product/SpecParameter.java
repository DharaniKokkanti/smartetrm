package com.etrm.system.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Catalog of quality-spec parameters (e.g. sulphur %, API gravity) — not itself product-scoped. */
@Entity
@Table(name = "spec_parameter")
public class SpecParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "parameter_id")
    private Integer parameterId;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @NotBlank
    @Size(max = 30)
    @Column(name = "parameter_code", nullable = false, length = 30)
    private String parameterCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "parameter_name", nullable = false, length = 200)
    private String parameterName;

    @NotBlank
    @Column(name = "parameter_category", nullable = false, length = 30)
    private String parameterCategory;

    @NotBlank
    @Column(name = "data_type", nullable = false, length = 20)
    private String dataType;

    @Column(name = "default_uom_id")
    private Integer defaultUomId;

    // TINYINT -> Short.
    @NotNull
    @Column(name = "decimal_places", nullable = false)
    private Short decimalPlaces = 2;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getParameterId() {
        return parameterId;
    }

    public void setParameterId(Integer parameterId) {
        this.parameterId = parameterId;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
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

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public Integer getDefaultUomId() {
        return defaultUomId;
    }

    public void setDefaultUomId(Integer defaultUomId) {
        this.defaultUomId = defaultUomId;
    }

    public Short getDecimalPlaces() {
        return decimalPlaces;
    }

    public void setDecimalPlaces(Short decimalPlaces) {
        this.decimalPlaces = decimalPlaces;
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
}
