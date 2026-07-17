package com.etrm.system.rinfuelcategory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * dbo.rin_fuel_category — flat CRUD, no FK resolution: fuel_type is a plain
 * nvarchar column (no lookup table backs it), same free-string treatment as
 * rin_account.account_type.
 */
@Entity
@Table(name = "rin_fuel_category")
public class RinFuelCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    // dbo.rin_fuel_category.d_code is NVARCHAR(5) — sys.columns.max_length
    // is in bytes for NVARCHAR (2 bytes/char), so the real char limit is 5,
    // not the raw byte count. A @Size(max=10) here let a 6-10 char value
    // pass validation only to fail with a DB truncation error.
    @NotBlank
    @Size(max = 5)
    @Column(name = "d_code", nullable = false, length = 5)
    private String dCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "fuel_name", nullable = false, length = 200)
    private String fuelName;

    @NotBlank
    @Size(max = 60)
    @Column(name = "fuel_type", nullable = false, length = 60)
    private String fuelType;

    @NotNull
    @Column(name = "equivalence_value", nullable = false, precision = 5, scale = 2)
    private BigDecimal equivalenceValue;

    @Size(max = 1000)
    @Column(name = "energy_sources", length = 1000)
    private String energySources;

    @Column(name = "description", columnDefinition = "nvarchar(max)")
    private String description;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    /*
     * Explicit @JsonProperty("dCode") is required: JavaBeans introspection
     * treats getDCode()/setDCode() as property "DCode" (leading two
     * uppercase letters after "get"/"set" are left as-is), which would
     * mismatch the frontend's camelCase "dCode" field name.
     */
    @JsonProperty("dCode")
    public String getDCode() {
        return dCode;
    }

    @JsonProperty("dCode")
    public void setDCode(String dCode) {
        this.dCode = dCode;
    }

    public String getFuelName() {
        return fuelName;
    }

    public void setFuelName(String fuelName) {
        this.fuelName = fuelName;
    }

    public String getFuelType() {
        return fuelType;
    }

    public void setFuelType(String fuelType) {
        this.fuelType = fuelType;
    }

    public BigDecimal getEquivalenceValue() {
        return equivalenceValue;
    }

    public void setEquivalenceValue(BigDecimal equivalenceValue) {
        this.equivalenceValue = equivalenceValue;
    }

    public String getEnergySources() {
        return energySources;
    }

    public void setEnergySources(String energySources) {
        this.energySources = energySources;
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
