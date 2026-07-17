package com.etrm.system.bolmo;

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
 * bolmo_leg.order_id has no TradeOrder JPA entity to join against anywhere in
 * this codebase (same scoping note as Nomination/DeliveryInstruction) —
 * orderId is a plain Integer and orderReference always serializes as null.
 */
@Entity
@Table(name = "bolmo_leg")
public class BolmoLeg {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "leg_id")
    private Integer legId;

    @NotNull
    @Column(name = "bolmo_id", nullable = false)
    private Integer bolmoId;

    @Column(name = "order_id")
    private Integer orderId;

    @Transient
    @JsonProperty
    private String orderReference;

    @NotBlank
    @Size(max = 4)
    @Column(name = "direction", nullable = false, length = 4)
    private String direction;

    @NotNull
    @Column(name = "quantity", nullable = false, precision = 18, scale = 6)
    private BigDecimal quantity;

    @NotNull
    @Column(name = "uom_id", nullable = false)
    private Integer uomId;

    @Column(name = "price", precision = 18, scale = 6)
    private BigDecimal price;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Integer getLegId() {
        return legId;
    }

    public void setLegId(Integer legId) {
        this.legId = legId;
    }

    public Integer getBolmoId() {
        return bolmoId;
    }

    public void setBolmoId(Integer bolmoId) {
        this.bolmoId = bolmoId;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getOrderReference() {
        return orderReference;
    }

    public void setOrderReference(String orderReference) {
        this.orderReference = orderReference;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
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
}
