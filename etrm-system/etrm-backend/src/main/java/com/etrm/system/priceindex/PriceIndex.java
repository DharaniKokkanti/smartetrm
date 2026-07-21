package com.etrm.system.priceindex;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * commodity_id resolves to the frontend's plain commodityType string via
 * CommodityTypeMapping (dbo.commodity has exactly 5 rows — see that class's
 * doc comment). created_at added by V101 (table had zero audit columns);
 * created_by/updated_at/updated_by added by V149 — see GlAccount.java's
 * doc comment for the general pattern.
 */
@Entity
@Table(name = "price_index")
@EntityListeners(AuditingEntityListener.class)
public class PriceIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_index_id")
    private Integer priceIndexId;

    // V131 — optimistic locking, see LegalEntity.java's rowVersion doc comment.
    @Version
    @Column(name = "row_version", nullable = false)
    private Integer rowVersion;

    @Column(name = "commodity_id")
    private Integer commodityId;

    @Transient
    private String commodityType;

    @NotBlank
    @Size(max = 30)
    @Column(name = "index_code", nullable = false, length = 30)
    private String indexCode;

    @NotBlank
    @Size(max = 200)
    @Column(name = "index_name", nullable = false, length = 200)
    private String indexName;

    @NotNull
    @Column(name = "currency_id", nullable = false)
    private Integer currencyId;

    @Transient
    @JsonProperty
    private String currencyCode;

    @NotNull
    @Column(name = "uom_id", nullable = false)
    private Integer uomId;

    @Transient
    @JsonProperty
    private String uomCode;

    @Size(max = 100)
    @Column(name = "publication_source", length = 100)
    private String publicationSource;

    @Size(max = 100)
    @Column(name = "publication_page", length = 100)
    private String publishedPage;

    @Column(name = "fixing_time")
    private LocalTime fixingTime;

    @Size(max = 50)
    @Column(name = "fixing_timezone", length = 50)
    private String fixingTimezone;

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

    public Integer getPriceIndexId() {
        return priceIndexId;
    }

    public void setPriceIndexId(Integer priceIndexId) {
        this.priceIndexId = priceIndexId;
    }

    public Integer getRowVersion() {
        return rowVersion;
    }

    public void setRowVersion(Integer rowVersion) {
        this.rowVersion = rowVersion;
    }

    public Integer getCommodityId() {
        return commodityId;
    }

    public void setCommodityId(Integer commodityId) {
        this.commodityId = commodityId;
    }

    @JsonProperty("commodityType")
    public String getCommodityType() {
        return commodityType;
    }

    @JsonProperty("commodityType")
    public void setCommodityType(String commodityType) {
        this.commodityType = commodityType;
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

    public String getPublicationSource() {
        return publicationSource;
    }

    public void setPublicationSource(String publicationSource) {
        this.publicationSource = publicationSource;
    }

    public String getPublishedPage() {
        return publishedPage;
    }

    public void setPublishedPage(String publishedPage) {
        this.publishedPage = publishedPage;
    }

    public LocalTime getFixingTime() {
        return fixingTime;
    }

    public void setFixingTime(LocalTime fixingTime) {
        this.fixingTime = fixingTime;
    }

    public String getFixingTimezone() {
        return fixingTimezone;
    }

    public void setFixingTimezone(String fixingTimezone) {
        this.fixingTimezone = fixingTimezone;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
