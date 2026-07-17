package com.etrm.system.uomconversion;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * dbo.uom_conversion is a dedicated (non-Tier2) entity with real hard
 * DELETE (no is_active column). The frontend only ever sends/receives the
 * denormalized fromUomCode/toUomCode display codes, never the raw
 * from_uom_id/to_uom_id — UomConversionService resolves the incoming code
 * strings to ids via UnitOfMeasureRepository on create/update.
 * commodity_type is a plain CHECK-backed varchar (not an FK), matching the
 * frontend's CommodityType string-union type.
 */
@Entity
@Table(name = "uom_conversion")
public class UomConversion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversion_id")
    private Integer conversionId;

    @NotNull
    @Column(name = "from_uom_id", nullable = false)
    private Integer fromUomId;

    @Transient
    @JsonProperty
    private String fromUomCode;

    @NotNull
    @Column(name = "to_uom_id", nullable = false)
    private Integer toUomId;

    @Transient
    @JsonProperty
    private String toUomCode;

    @NotNull
    @Column(name = "factor", nullable = false, precision = 13, scale = 10)
    private BigDecimal factor;

    @Size(max = 20)
    @Column(name = "commodity_type", length = 20)
    private String commodityType;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Size(max = 200)
    @Column(name = "notes", length = 200)
    private String notes;

    public Integer getConversionId() {
        return conversionId;
    }

    public void setConversionId(Integer conversionId) {
        this.conversionId = conversionId;
    }

    public Integer getFromUomId() {
        return fromUomId;
    }

    public void setFromUomId(Integer fromUomId) {
        this.fromUomId = fromUomId;
    }

    public String getFromUomCode() {
        return fromUomCode;
    }

    public void setFromUomCode(String fromUomCode) {
        this.fromUomCode = fromUomCode;
    }

    public Integer getToUomId() {
        return toUomId;
    }

    public void setToUomId(Integer toUomId) {
        this.toUomId = toUomId;
    }

    public String getToUomCode() {
        return toUomCode;
    }

    public void setToUomCode(String toUomCode) {
        this.toUomCode = toUomCode;
    }

    public BigDecimal getFactor() {
        return factor;
    }

    public void setFactor(BigDecimal factor) {
        this.factor = factor;
    }

    public String getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
