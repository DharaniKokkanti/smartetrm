package com.etrm.system.rinfuelcategory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * dbo.rin_fuel_category — flat CRUD, no FK resolution: fuel_type is a plain
 * nvarchar column (no lookup table backs it), same free-string treatment as
 * rin_account.account_type.
 */
@Entity
@Table(name = "rin_fuel_category")
@EntityListeners(AuditingEntityListener.class)
public class RinFuelCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    // V133 — optimistic locking, see LegalEntity.rowVersion (V127) for the full explanation.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

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

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    public Integer getCategoryId() {
        return categoryId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
