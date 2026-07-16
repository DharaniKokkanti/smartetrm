package com.etrm.system.bunker;

import com.etrm.system.common.AuditableEntity;
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

@Entity
@Table(name = "bunker_stem")
public class BunkerStem extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bunker_stem_id")
    private Integer bunkerStemId;

    @Column(name = "voyage_id")
    private Integer voyageId;

    @NotNull
    @Column(name = "vessel_id", nullable = false)
    private Integer vesselId;

    @Transient
    @JsonProperty
    private String vesselName;

    @NotNull
    @Column(name = "fuel_grade_id", nullable = false)
    private Integer fuelGradeId;

    @Transient
    @JsonProperty
    private String fuelGradeCode;

    @NotNull
    @Column(name = "quantity_mt", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityMt;

    @Column(name = "price_per_mt", precision = 14, scale = 4)
    private BigDecimal pricePerMt;

    @Column(name = "currency_id")
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @Column(name = "supplier_counterparty_id")
    private Integer supplierCounterpartyId;

    @Transient
    @JsonProperty
    private String supplierName;

    @Column(name = "port_location_id")
    private Integer portLocationId;

    @Transient
    @JsonProperty
    private String portLocationName;

    @Column(name = "rob_before_mt", precision = 14, scale = 3)
    private BigDecimal robBeforeMt;

    @Column(name = "rob_after_mt", precision = 14, scale = 3)
    private BigDecimal robAfterMt;

    @NotBlank
    @Column(name = "status", nullable = false, length = 15)
    private String status = "NOMINATED";

    @Column(name = "stem_date")
    private LocalDate stemDate;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getBunkerStemId() {
        return bunkerStemId;
    }

    public void setBunkerStemId(Integer bunkerStemId) {
        this.bunkerStemId = bunkerStemId;
    }

    public Integer getVoyageId() {
        return voyageId;
    }

    public void setVoyageId(Integer voyageId) {
        this.voyageId = voyageId;
    }

    public Integer getVesselId() {
        return vesselId;
    }

    public void setVesselId(Integer vesselId) {
        this.vesselId = vesselId;
    }

    public String getVesselName() {
        return vesselName;
    }

    public void setVesselName(String vesselName) {
        this.vesselName = vesselName;
    }

    public Integer getFuelGradeId() {
        return fuelGradeId;
    }

    public void setFuelGradeId(Integer fuelGradeId) {
        this.fuelGradeId = fuelGradeId;
    }

    public String getFuelGradeCode() {
        return fuelGradeCode;
    }

    public void setFuelGradeCode(String fuelGradeCode) {
        this.fuelGradeCode = fuelGradeCode;
    }

    public BigDecimal getQuantityMt() {
        return quantityMt;
    }

    public void setQuantityMt(BigDecimal quantityMt) {
        this.quantityMt = quantityMt;
    }

    public BigDecimal getPricePerMt() {
        return pricePerMt;
    }

    public void setPricePerMt(BigDecimal pricePerMt) {
        this.pricePerMt = pricePerMt;
    }

    public Integer getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(Integer currencyId) {
        this.currencyId = currencyId;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public Integer getSupplierCounterpartyId() {
        return supplierCounterpartyId;
    }

    public void setSupplierCounterpartyId(Integer supplierCounterpartyId) {
        this.supplierCounterpartyId = supplierCounterpartyId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public Integer getPortLocationId() {
        return portLocationId;
    }

    public void setPortLocationId(Integer portLocationId) {
        this.portLocationId = portLocationId;
    }

    public String getPortLocationName() {
        return portLocationName;
    }

    public void setPortLocationName(String portLocationName) {
        this.portLocationName = portLocationName;
    }

    public BigDecimal getRobBeforeMt() {
        return robBeforeMt;
    }

    public void setRobBeforeMt(BigDecimal robBeforeMt) {
        this.robBeforeMt = robBeforeMt;
    }

    public BigDecimal getRobAfterMt() {
        return robAfterMt;
    }

    public void setRobAfterMt(BigDecimal robAfterMt) {
        this.robAfterMt = robAfterMt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getStemDate() {
        return stemDate;
    }

    public void setStemDate(LocalDate stemDate) {
        this.stemDate = stemDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
