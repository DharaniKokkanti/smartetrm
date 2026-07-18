package com.etrm.system.book;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * dbo.book_classification_dimension (V122) — the extensible axis list a
 * dbo.book_classification row can hang a value off (COMMODITY today; a
 * future STRATEGY_TYPE/REGION/PRODUCT_FAMILY axis is a data insert here, not
 * a schema change on dbo.book).
 */
@Entity
@Table(name = "book_classification_dimension")
public class BookClassificationDimension extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dimension_id")
    private Integer dimensionId;

    @NotBlank
    @Size(max = 30)
    @Column(name = "dimension_code", nullable = false, length = 30)
    private String dimensionCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "dimension_name", nullable = false, length = 100)
    private String dimensionName;

    @NotNull
    @Column(name = "is_multi_valued", nullable = false)
    private Boolean isMultiValued = false;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Short sortOrder = 0;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getDimensionId() {
        return dimensionId;
    }

    public void setDimensionId(Integer dimensionId) {
        this.dimensionId = dimensionId;
    }

    public String getDimensionCode() {
        return dimensionCode;
    }

    public void setDimensionCode(String dimensionCode) {
        this.dimensionCode = dimensionCode;
    }

    public String getDimensionName() {
        return dimensionName;
    }

    public void setDimensionName(String dimensionName) {
        this.dimensionName = dimensionName;
    }

    public Boolean getIsMultiValued() {
        return isMultiValued;
    }

    public void setIsMultiValued(Boolean isMultiValued) {
        this.isMultiValued = isMultiValued;
    }

    public Short getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Short sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
