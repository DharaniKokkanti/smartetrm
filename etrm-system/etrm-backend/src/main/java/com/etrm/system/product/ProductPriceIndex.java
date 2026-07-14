package com.etrm.system.product;

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

/** V102 added `role` — see that migration's doc comment. */
@Entity
@Table(name = "product_price_index")
public class ProductPriceIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_index_id")
    private Integer productIndexId;

    @NotNull
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @NotNull
    @Column(name = "price_index_id", nullable = false)
    private Integer priceIndexId;

    @Transient
    @JsonProperty
    private String indexCode;

    @Transient
    @JsonProperty
    private String indexName;

    @Transient
    @JsonProperty
    private String publicationSource;

    @Transient
    @JsonProperty
    private String currencyCode;

    @Transient
    @JsonProperty
    private String uomCode;

    @NotBlank
    @Column(name = "role", nullable = false, length = 20)
    private String role;

    @NotNull
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Integer getProductIndexId() {
        return productIndexId;
    }

    public void setProductIndexId(Integer productIndexId) {
        this.productIndexId = productIndexId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public String getIndexCode() {
        return indexCode;
    }

    public void setIndexCode(String indexCode) {
        this.indexCode = indexCode;
    }

    public String getIndexName() {
        return indexName;
    }

    public void setIndexName(String indexName) {
        this.indexName = indexName;
    }

    public String getPublicationSource() {
        return publicationSource;
    }

    public void setPublicationSource(String publicationSource) {
        this.publicationSource = publicationSource;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getUomCode() {
        return uomCode;
    }

    public void setUomCode(String uomCode) {
        this.uomCode = uomCode;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
