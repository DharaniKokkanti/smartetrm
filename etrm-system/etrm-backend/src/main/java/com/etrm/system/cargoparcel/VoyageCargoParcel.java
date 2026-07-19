package com.etrm.system.cargoparcel;

import com.etrm.system.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * The commodity-agnostic bridge between a voyage and the existing trade
 * book. trade_order_id/trade_item_id reference dbo.trade_order/trade_item
 * by id only — those tables have no JPA entity in this codebase yet
 * (trade/trade_order/trade_item/position are explicitly out of scope for
 * the Master Data build per the project handoff), so these two fields stay
 * plain, undenormalized ids rather than inventing a reader entity ahead of
 * that future batch.
 */
@Entity
@Table(name = "voyage_cargo_parcel")
public class VoyageCargoParcel extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cargo_parcel_id")
    private Integer cargoParcelId;

    // V132 — optimistic locking (Batch E, voyage-ops/maritime). See V127/LegalEntity for the pattern.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @NotNull
    @Column(name = "voyage_id", nullable = false)
    private Integer voyageId;

    @Column(name = "product_id")
    private Integer productId;

    @Transient
    @JsonProperty
    private String productName;

    @Column(name = "commodity_type_id")
    private Integer commodityTypeId;

    @Transient
    @JsonProperty
    private String commodityTypeCode;

    @NotNull
    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;

    @NotNull
    @Column(name = "uom_id", nullable = false)
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @Column(name = "load_terminal_location_id")
    private Integer loadTerminalLocationId;

    @Transient
    @JsonProperty
    private String loadTerminalName;

    @Column(name = "discharge_terminal_location_id")
    private Integer dischargeTerminalLocationId;

    @Transient
    @JsonProperty
    private String dischargeTerminalName;

    @Column(name = "trade_order_id")
    private Integer tradeOrderId;

    @Column(name = "trade_item_id")
    private Integer tradeItemId;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getCargoParcelId() {
        return cargoParcelId;
    }

    public void setCargoParcelId(Integer cargoParcelId) {
        this.cargoParcelId = cargoParcelId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getVoyageId() {
        return voyageId;
    }

    public void setVoyageId(Integer voyageId) {
        this.voyageId = voyageId;
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

    public Integer getCommodityTypeId() {
        return commodityTypeId;
    }

    public void setCommodityTypeId(Integer commodityTypeId) {
        this.commodityTypeId = commodityTypeId;
    }

    public String getCommodityTypeCode() {
        return commodityTypeCode;
    }

    public void setCommodityTypeCode(String commodityTypeCode) {
        this.commodityTypeCode = commodityTypeCode;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
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

    public Integer getLoadTerminalLocationId() {
        return loadTerminalLocationId;
    }

    public void setLoadTerminalLocationId(Integer loadTerminalLocationId) {
        this.loadTerminalLocationId = loadTerminalLocationId;
    }

    public String getLoadTerminalName() {
        return loadTerminalName;
    }

    public void setLoadTerminalName(String loadTerminalName) {
        this.loadTerminalName = loadTerminalName;
    }

    public Integer getDischargeTerminalLocationId() {
        return dischargeTerminalLocationId;
    }

    public void setDischargeTerminalLocationId(Integer dischargeTerminalLocationId) {
        this.dischargeTerminalLocationId = dischargeTerminalLocationId;
    }

    public String getDischargeTerminalName() {
        return dischargeTerminalName;
    }

    public void setDischargeTerminalName(String dischargeTerminalName) {
        this.dischargeTerminalName = dischargeTerminalName;
    }

    public Integer getTradeOrderId() {
        return tradeOrderId;
    }

    public void setTradeOrderId(Integer tradeOrderId) {
        this.tradeOrderId = tradeOrderId;
    }

    public Integer getTradeItemId() {
        return tradeItemId;
    }

    public void setTradeItemId(Integer tradeItemId) {
        this.tradeItemId = tradeItemId;
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
